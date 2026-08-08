import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  VotePosition,
  PersonLifeStatus,
} from '@optimitron/db'
import {
  getPrismaClient,
  cleanDatabase,
  seedTestData,
  ensureTreatyReferendum,
} from '../utils/db-test-utils'

describe('Database Integration Tests', () => {
  const prisma = getPrismaClient()

  beforeEach(async () => {
    await cleanDatabase()
    await ensureTreatyReferendum()
  })

  afterEach(async () => {
    await cleanDatabase()
  })

  describe('User CRUD operations', () => {
    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'integration@test.com',
          referralCode: 'INT_TEST_123',
        },
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('integration@test.com')
      expect(user.referralCode).toBe('INT_TEST_123')
    })

    it('should find user by email', async () => {
      await prisma.user.create({
        data: {
          email: 'find@test.com',
          referralCode: 'FIND_TEST_123',
        },
      })

      const found = await prisma.user.findUnique({
        where: { email: 'find@test.com' },
      })

      expect(found).toBeDefined()
      expect(found?.email).toBe('find@test.com')
    })

    it('should update user data', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'update@test.com',
          referralCode: 'UPDATE_TEST_123',
          newsletterSubscribed: true,
        },
      })

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { newsletterSubscribed: false },
      })

      expect(updated.newsletterSubscribed).toBe(false)
    })

    it('should delete a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@test.com',
          referralCode: 'DELETE_TEST_123',
        },
      })

      await prisma.user.delete({
        where: { id: user.id },
      })

      const found = await prisma.user.findUnique({
        where: { email: 'delete@test.com' },
      })

      expect(found).toBeNull()
    })
  })

  describe('Data relationships', () => {
    it('should create a ReferendumVote for a user via Person', async () => {
      const { testUser, testPerson, referendum } = await seedTestData()

      const vote = await prisma.referendumVote.create({
        data: {
          userId: testUser.id,
          personId: testPerson.id,
          referendumId: referendum.id,
          answer: VotePosition.YES,
        },
      })

      expect(vote).toBeDefined()
      expect(vote.userId).toBe(testUser.id)
      expect(vote.personId).toBe(testPerson.id)
      expect(vote.referendumId).toBe(referendum.id)
      expect(vote.answer).toBe(VotePosition.YES)
    })
  })

  describe('Transactions', () => {
    it('should rollback transaction on error', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'transaction@test.com',
              referralCode: 'TX_TEST_123',
            },
          })

          await tx.user.create({
            data: {
              email: 'transaction@test.com', // Duplicate email
              referralCode: 'TX_TEST_456',
            },
          })
        })
      } catch (error) {
        // Transaction should have rolled back - this is expected
        console.debug("Transaction rolled back as expected:", error)
      }

      const user = await prisma.user.findUnique({
        where: { email: 'transaction@test.com' },
      })

      expect(user).toBeNull()
    })

    it('should commit successful transaction', async () => {
      const referendum = await ensureTreatyReferendum()

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'success@test.com',
            referralCode: 'SUCCESS_123',
          },
        })

        const person = await tx.person.create({
          data: {
            displayName: 'Success User',
            email: 'success@test.com',
            createdByUserId: user.id,
            sourceRef: `test:user:${user.id}`,
            lifeStatus: PersonLifeStatus.LIVING,
          },
        })

        await tx.user.update({
          where: { id: user.id },
          data: { personId: person.id },
        })

        const vote = await tx.referendumVote.create({
          data: {
            userId: user.id,
            personId: person.id,
            referendumId: referendum.id,
            answer: VotePosition.YES,
          },
        })

        return { user, vote }
      })

      expect(result.user).toBeDefined()
      expect(result.vote).toBeDefined()

      const user = await prisma.user.findUnique({
        where: { id: result.user.id },
        include: { referendumVotes: true },
      })

      expect(user).toBeDefined()
      expect(user?.referendumVotes).toHaveLength(1)
      expect(user?.referendumVotes[0]?.id).toBe(result.vote.id)
    })
  })
})
