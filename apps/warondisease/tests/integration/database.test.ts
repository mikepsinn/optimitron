import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getPrismaClient, cleanDatabase, seedTestData } from '../utils/db-test-utils'

describe('Database Integration Tests', () => {
  const prisma = getPrismaClient()

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase()
  })

  afterEach(async () => {
    // Clean up after each test
    await cleanDatabase()
  })

  describe('User CRUD operations', () => {
    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'integration@test.com',
          name: 'Integration Test User',
          referralCode: 'INT_TEST_123',
        },
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('integration@test.com')
      expect(user.name).toBe('Integration Test User')
    })

    it('should find user by email', async () => {
      // Create a user first
      await prisma.user.create({
        data: {
          email: 'find@test.com',
          name: 'Find Test User',
          referralCode: 'FIND_TEST_123',
        },
      })

      // Find the user
      const found = await prisma.user.findUnique({
        where: { email: 'find@test.com' },
      })

      expect(found).toBeDefined()
      expect(found?.email).toBe('find@test.com')
    })

    it('should update user data', async () => {
      // Create a user
      const user = await prisma.user.create({
        data: {
          email: 'update@test.com',
          name: 'Original Name',
          referralCode: 'UPDATE_TEST_123',
        },
      })

      // Update the user
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      })

      expect(updated.name).toBe('Updated Name')
    })

    it('should delete a user', async () => {
      // Create a user
      const user = await prisma.user.create({
        data: {
          email: 'delete@test.com',
          name: 'Delete Test User',
          referralCode: 'DELETE_TEST_123',
        },
      })

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id },
      })

      // Try to find the deleted user
      const found = await prisma.user.findUnique({
        where: { email: 'delete@test.com' },
      })

      expect(found).toBeNull()
    })
  })

  describe('Data relationships', () => {
    it('should create a vote for a user', async () => {
      const { testUser } = await seedTestData()

      const vote = await prisma.referendumVote.create({
        data: {
          userId: testUser.id,
          answer: 'YES',
          ipAddress: '127.0.0.1',
          fingerprint: 'test-fingerprint-123',
        },
      })

      expect(vote).toBeDefined()
      expect(vote.userId).toBe(testUser.id)
      expect(vote.answer).toBe('YES')
    })

    it('should create a donation for a user', async () => {
      const { testUser } = await seedTestData()

      const donation = await prisma.donation.create({
        data: {
          userId: testUser.id,
          amount: 10000, // $100 in cents
          frequency: 'ONE_TIME',
          status: 'COMPLETED',
          stripePaymentId: 'pi_test_integration',
        },
      })

      expect(donation).toBeDefined()
      expect(donation.userId).toBe(testUser.id)
      expect(donation.amount).toBe(10000)
      expect(donation.frequency).toBe('ONE_TIME')
    })
  })

  describe('Transactions', () => {
    it('should rollback transaction on error', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          // Create a user
          await tx.user.create({
            data: {
              email: 'transaction@test.com',
              name: 'Transaction Test',
              referralCode: 'TX_TEST_123',
            },
          })

          // Force an error by trying to create duplicate
          await tx.user.create({
            data: {
              email: 'transaction@test.com', // Duplicate email
              name: 'Duplicate User',
              referralCode: 'TX_TEST_456',
            },
          })
        })
      } catch (error) {
        // Transaction should have rolled back - this is expected
        console.debug("Transaction rolled back as expected:", error)
      }

      // Verify no user was created
      const user = await prisma.user.findUnique({
        where: { email: 'transaction@test.com' },
      })

      expect(user).toBeNull()
    })

    it('should commit successful transaction', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'success@test.com',
            name: 'Success User',
            referralCode: 'SUCCESS_123',
          },
        })

        const vote = await tx.vote.create({
          data: {
            userId: user.id,
            answer: 'YES',
            ipAddress: '127.0.0.1',
            fingerprint: 'test-fingerprint',
          },
        })

        return { user, vote }
      })

      expect(result.user).toBeDefined()
      expect(result.vote).toBeDefined()

      // Verify data was committed
      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
        include: { votes: true },
      })

      expect(user).toBeDefined()
      expect(user?.votes?.id).toBe(result.vote.id)
    })
  })
})
