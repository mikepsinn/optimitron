"use client";

/// <reference path="../types/next-auth.d.ts" />

import React from "react";

import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@optimitron/neobrutalist-ui/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@optimitron/neobrutalist-ui/ui/accordion";
import { ExternalLink, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  getTopLevelNavItems,
  getSidebarSections,
  getFooterBranding,
  getFooterSections,
  getContactInfo,
  getLegalItems,
  getCopyrightText,
  getSiteConfig,
} from "../lib/site-config";
import type { NavItem } from "../lib/nav-items";
import { VoteOrShareButton } from "./shared/VoteOrShareButton";
import { ROUTES } from "../lib/routes";
interface LayoutProps {
  children: React.ReactNode;
}

type SessionUser = {
  isAdmin?: boolean;
};

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  // Cast: apps and site-kit can resolve different next-auth copies, so module
  // augmentation on Session.user is not reliable across the monorepo boundary.
  const isAdmin = (session?.user as SessionUser | undefined)?.isAdmin || false;

  const handleHashLinkClick = (e: React.MouseEvent<Element>, path: string) => {
    setOpen(false);

    // Parse the path to get base path and hash (e.g., "/#vote" -> "/" and "vote")
    const [basePath, hash] = path.split("#");

    // Only prevent default and scroll if we're already on the target page
    // Otherwise, let Next.js navigate naturally
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    if (currentPath === basePath && hash) {
      e.preventDefault();

      setTimeout(() => {
        const targetElement = document.getElementById(hash);
        if (targetElement) {
          const headerHeight = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  const renderNavLink = (
    item: NavItem,
    className: string,
    onClick?: () => void,
  ) => {
    if (item.isExternal) {
      return (
        <a
          key={item.id}
          href={item.path}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
          title={item.description}
          onClick={onClick}
        >
          {item.emoji && <span className="mr-2">{item.emoji}</span>}
          {item.label.toUpperCase()}
          <ExternalLink className="inline-block ml-2 w-4 h-4 stroke-[3px]" />
        </a>
      );
    }

    const handleClick = (e: React.MouseEvent<Element>) => {
      if (item.requiresScrollHandler && item.path.includes("#")) {
        handleHashLinkClick(e, item.path);
      } else {
        onClick?.();
      }
    };

    return (
      <Link
        key={item.id}
        href={item.path}
        className={className}
        onClick={handleClick}
        title={item.description}
      >
        {item.emoji && <span className="mr-2">{item.emoji}</span>}
        {item.label.toUpperCase()}
      </Link>
    );
  };

  // Get navigation data from site config
  const siteConfig = getSiteConfig();
  const topLevelItems = getTopLevelNavItems();
  const sidebarSections = getSidebarSections();
  const footerBranding = getFooterBranding();
  const footerSections = getFooterSections();
  const contactInfo = getContactInfo();
  const legalItems = getLegalItems();
  const copyrightText = getCopyrightText();
  const footerComplianceNotice = siteConfig.footerComplianceNotice;
  const sidebarVoteCta =
    siteConfig.sidebarVoteCtaEnabled !== false ? (
      <VoteOrShareButton
        variant="default"
        size="lg"
        className="w-full py-6"
        onClick={(e: React.MouseEvent) => {
          handleHashLinkClick(e, "/#vote");
          setOpen(false);
        }}
      />
    ) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-primary bg-brutal-yellow p-4 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black uppercase tracking-tight hover:underline decoration-4"
          >
            <span className="md:hidden">
              {(siteConfig.headerBrandLabel ?? siteConfig.name).toUpperCase()}
            </span>
            <span className="hidden md:inline">
              {(siteConfig.headerBrandLabel ?? siteConfig.title).toUpperCase()}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Avatar Button */}
            {siteConfig.dashboardEnabled !== false ? (
              <Link href={ROUTES.dashboard}>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-brutal-cyan border-4 border-primary hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all rounded-full w-12 h-12"
                  title="Dashboard"
                >
                  {session?.user?.name ? (
                    <span className="text-lg font-black uppercase">
                      {session.user.name.charAt(0)}
                    </span>
                  ) : session?.user?.email ? (
                    <span className="text-lg font-black uppercase">
                      {session.user.email.charAt(0)}
                    </span>
                  ) : (
                    <User className="h-6 w-6 stroke-[3px]" />
                  )}
                  <span className="sr-only">Go to Dashboard</span>
                </Button>
              </Link>
            ) : null}

            {/* Hamburger Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background border-4 border-primary hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                >
                  <Menu className="h-6 w-6 stroke-[3px]" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] overflow-y-auto"
              >
                <SheetTitle className="text-2xl font-black uppercase">
                  Navigation Menu
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Main navigation menu with links to resources and ways to get
                  involved
                </SheetDescription>
                <nav className="flex flex-col gap-6 mt-8">
                  {siteConfig.sidebarVoteCtaPlacement === "top"
                    ? sidebarVoteCta
                    : null}

                  {/* Top-level nav items (outside accordion) */}
                  {topLevelItems.map((item) =>
                    renderNavLink(
                      item,
                      "text-2xl font-black uppercase hover:text-brutal-pink transition-colors border-b-4 border-primary pb-2",
                      () => setOpen(false),
                    ),
                  )}

                  {/* Sidebar sections (accordion) */}
                  <Accordion type="multiple" className="w-full">
                    {sidebarSections.map((section) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="border-b-4 border-primary"
                      >
                        <AccordionTrigger className="text-xl font-black uppercase hover:text-brutal-pink">
                          {section.label}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-3 pl-4">
                            {section.resolvedItems.map((item) =>
                              renderNavLink(
                                item,
                                "text-lg font-bold uppercase hover:text-brutal-pink transition-colors",
                                () => setOpen(false),
                              ),
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {/* Admin Link (only for admins) */}
                  {isAdmin && (
                    <Link
                      href={ROUTES.adminOrganizations}
                      className="text-2xl font-black uppercase hover:text-brutal-pink transition-colors border-b-4 border-primary pb-2"
                      onClick={() => setOpen(false)}
                    >
                      ⚙️ ADMIN
                    </Link>
                  )}

                  {isAuthenticated && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 border-b-4 border-primary pb-2 text-left text-2xl font-black uppercase transition-colors hover:text-brutal-pink"
                      onClick={() => {
                        setOpen(false);
                        void signOut({ callbackUrl: ROUTES.home });
                      }}
                    >
                      <LogOut className="h-6 w-6 stroke-[3px]" />
                      Log Out
                    </button>
                  )}

                  {siteConfig.sidebarVoteCtaPlacement !== "top"
                    ? sidebarVoteCta
                    : null}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {children}

      <footer className="bg-primary text-primary-foreground border-t-4 border-background py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Branding Section */}
            <div>
              <div className="text-3xl font-black uppercase mb-4">
                {footerBranding.title}
              </div>
              <p className="font-bold">{footerBranding.tagline}</p>
            </div>

            {/* Footer Sections (configurable columns) */}
            {footerSections.map((section) => (
              <div key={section.id}>
                <h3 className="text-xl font-black uppercase mb-4">
                  {section.label}
                </h3>
                <ul className="space-y-2 font-bold">
                  {section.resolvedItems.map((item) => (
                    <li key={item.id}>
                      {item.isExternal ? (
                        <a
                          href={item.path}
                          className="hover:text-brutal-yellow"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.label.toUpperCase()}
                          <ExternalLink className="inline-block ml-1 w-3 h-3 stroke-[3px]" />
                        </a>
                      ) : (
                        <Link
                          href={item.path}
                          className="hover:text-brutal-yellow"
                        >
                          {item.label.toUpperCase()}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Section */}
            <div>
              <h3 className="text-xl font-black uppercase mb-4">CONTACT</h3>
              <div className="space-y-2 font-bold">
                <div>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-brutal-yellow"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="border-t-4 border-background mt-8 pt-8">
            <div className="flex flex-wrap justify-center gap-6 font-bold text-sm mb-4">
              {legalItems.map((item, index, array) => (
                <React.Fragment key={item.id}>
                  <Link href={item.path} className="hover:text-brutal-yellow">
                    {item.label.toUpperCase()}
                  </Link>
                  {index < array.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="text-center font-bold uppercase">
              {copyrightText}
            </div>
            {footerComplianceNotice && (
              <div className="text-center text-sm font-bold mt-3 opacity-80">
                {footerComplianceNotice}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
