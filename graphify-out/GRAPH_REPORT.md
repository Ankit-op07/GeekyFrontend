# Graph Report - .  (2026-07-11)

## Corpus Check
- 200 files · ~222,825 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1200 nodes · 2170 edges · 172 communities (70 shown, 102 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dashboard Page
- Ui Sidebar
- Api Admin
- Ui Menubar
- Api Admin
- Package
- Tsconfig
- Ui Chart
- Admin Questions
- Package
- Api Payment
- Api Admin
- Api Companies
- Learn Kit Slug
- Ui Command
- Ui Popover
- Hooks Use Device Detection
- Lib Meta Pixel
- Components
- Nodejs Preview Q1 Multi Threaded.png
- Learn Page
- Login Page
- Ui Alert Dialog
- Checkout Kit
- Components Product Showcase
- Ui Context Menu
- Ui Dropdown Menu
- Ui Use Toast
- Ui Table
- Lib Session
- Components Purchase Notification
- Components React Checkout Content
- Ui Card
- Hooks Use Toast
- Ui Carousel
- Admin Users
- Api User
- Ui Drawer
- Ui Form
- Nodejs Preview Q3 Function Event.png
- Admin Interviews
- Ui Navigation Menu
- Nodejs Preview Q4 Http Module.png
- Api Admin
- Ui Toast
- Ui Button
- Ui Breadcrumb
- Nodejs Preview Q2 Events Module.png
- Admin Kit Onboarding
- Hooks Use Razorpay
- Ui Toggle Group
- Components Company Wise Kit Landing
- Scripts Seed Kits
- Admin Rich Text Editor
- Ui Accordion
- Ui Alert
- Api Admin
- Public Inter.png
- Admin Access
- Admin Layout
- Api Admin
- Api Leaderboard
- Components Ai Chatbot
- Public Interview.png
- Api Auth
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Next.config
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Package
- Platforms Codechef.svg
- Platforms Gfg.svg
- Postcss.config
- App Apple Icon.png
- App Icon.png
- Public Inter Mobile.jpg
- Public Placeholder.jpg
- Public Placeholder Logo.png
- Public Placeholder Logo.svg
- Public Placeholder.svg
- Public Placeholder User.jpg
- Platforms Hackerrank.svg
- Platforms Interviewbit.svg
- Platforms Leetcode.svg

## God Nodes (most connected - your core abstractions)
1. `cn()` - 226 edges
2. `connectToDatabase()` - 101 edges
3. `react` - 21 edges
4. `Button()` - 20 edges
5. `extractSessionFromRequest()` - 20 edges
6. `Badge()` - 19 edges
7. `appConstants()` - 19 edges
8. `compilerOptions` - 16 edges
9. `Card()` - 15 edges
10. `Topic` - 13 edges

## Surprising Connections (you probably didn't know these)
- `ProfileTab()` --indirect_call--> `Calendar()`  [INFERRED]
  app/dashboard/page.tsx → components/ui/calendar.tsx
- `POST()` --calls--> `connectToDatabase()`  [EXTRACTED]
  app/api/admin/seed-questions/route.ts → lib/db.ts
- `GET()` --calls--> `connectToDatabase()`  [EXTRACTED]
  app/api/companies/[id]/questions/route.ts → lib/db.ts
- `POST()` --calls--> `connectToDatabase()`  [EXTRACTED]
  app/api/companies/[id]/questions/route.ts → lib/db.ts
- `GET()` --calls--> `connectToDatabase()`  [EXTRACTED]
  app/api/companies/[id]/route.ts → lib/db.ts

## Import Cycles
- None detected.

## Communities (172 total, 102 thin omitted)

### Community 0 - "Dashboard Page"
Cohesion: 0.05
Nodes (33): DashboardPage(), DbKit, evaluateInterviewAnswer(), formatInterviewDate(), getCheckoutPathForKit(), getRetryFocus(), INTERVIEW_ROUNDS, InterviewAnswer (+25 more)

### Community 1 - "Ui Sidebar"
Cohesion: 0.06
Nodes (39): Input(), Separator(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+31 more)

### Community 2 - "Api Admin"
Cohesion: 0.09
Nodes (27): GET(), DELETE(), GET(), POST(), PUT(), DELETE(), PATCH(), GET() (+19 more)

### Community 3 - "Ui Menubar"
Cohesion: 0.08
Nodes (30): Avatar(), AvatarFallback(), AvatarImage(), Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel() (+22 more)

### Community 4 - "Api Admin"
Cohesion: 0.11
Nodes (24): Chapter, Topic, DELETE(), GET(), POST(), PUT(), DELETE(), GET() (+16 more)

### Community 5 - "Package"
Cohesion: 0.07
Nodes (29): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/jsonwebtoken, @types/node, @types/nodemailer (+21 more)

### Community 6 - "Tsconfig"
Cohesion: 0.07
Nodes (28): ./*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+20 more)

### Community 7 - "Ui Chart"
Cohesion: 0.09
Nodes (20): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES (+12 more)

### Community 8 - "Admin Questions"
Cohesion: 0.11
Nodes (20): AdminQuestionsPage(), Company, CompanyLogoAdmin(), DIFF_STYLE, DIFFICULTY_OPTIONS, GRADIENT_OPTIONS, isImageUrl(), PLATFORM_LOGOS (+12 more)

### Community 9 - "Package"
Cohesion: 0.09
Nodes (23): autoprefixer, fast-equals, highlight.js, @hookform/resolvers, next, next-themes, dependencies, autoprefixer (+15 more)

### Community 10 - "Api Payment"
Cohesion: 0.15
Nodes (20): Order, buildKitOnboardingEmail(), createTransporter(), GET(), POST(), processOneEmail(), auth, buildEmailHtml() (+12 more)

### Community 11 - "Api Admin"
Cohesion: 0.15
Nodes (16): GET(), isAdmin(), PATCH(), VALID_STATUSES, GET(), ALLOWED_DURATIONS, GET(), POST() (+8 more)

### Community 12 - "Api Companies"
Cohesion: 0.11
Nodes (15): POST(), GET(), POST(), DELETE(), GET(), PUT(), GET(), POST() (+7 more)

### Community 13 - "Learn Kit Slug"
Cohesion: 0.14
Nodes (16): getCheckoutPathForKit(), KitInfo, KitLayout(), KitIndexPage(), KitInfo, SidebarChapter, SidebarContext, SidebarContextType (+8 more)

### Community 14 - "Ui Command"
Cohesion: 0.14
Nodes (16): PurchaseDialogProps, Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+8 more)

### Community 15 - "Ui Popover"
Cohesion: 0.09
Nodes (8): Checkbox(), HoverCardContent(), PopoverContent(), Progress(), ResizableHandle(), ResizablePanelGroup(), Switch(), Textarea()

### Community 16 - "Hooks Use Device Detection"
Cohesion: 0.18
Nodes (13): POST(), razorpay, CheckoutContent(), ContentPreviewPage(), DiwaliHero(), Pricing(), DeviceInfo, PricingConfig (+5 more)

### Community 17 - "Lib Meta Pixel"
Cohesion: 0.18
Nodes (15): POST(), razorpay, PayContent(), SessionUser, getKitById(), KIT_CATALOG, generateEventId(), getCookie() (+7 more)

### Community 18 - "Components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 19 - "Nodejs Preview Q1 Multi Threaded.png"
Cohesion: 0.11
Nodes (18): Q1: What is Multi Threaded Programming? (diagram), API (cloud/server icon), Browser icons (Chrome, Edge, Firefox, Opera, Safari), Back to Chapter Index (link), Client machine/server icon, Client-Side, Multi Threaded Programming (concept), Request (+10 more)

### Community 20 - "Learn Page"
Cohesion: 0.21
Nodes (6): getCheckoutPathForKit(), Kit, LearnPage(), SiteFooter(), SessionUser, SiteHeader()

### Community 21 - "Login Page"
Cohesion: 0.19
Nodes (7): Window, RegisterContent(), Window, ResetPasswordContent(), AuthCard(), getPasswordStrength(), GoogleLogo()

### Community 22 - "Ui Alert Dialog"
Cohesion: 0.20
Nodes (12): GRADIENT_OPTIONS, Kit, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+4 more)

### Community 23 - "Checkout Kit"
Cohesion: 0.19
Nodes (10): CheckoutPage(), KitDetails, kitsData, parseCurrencyValue(), { react_kit_price, react_kit_original_price, js_kit_price, js_kit_original_price, complete_kit_price, complete_kit_original_price }, SLUG_TO_KIT_ID, NodejsCheckoutContent(), PaymentButton() (+2 more)

### Community 24 - "Components Product Showcase"
Cohesion: 0.16
Nodes (10): Curriculum(), KitCurriculum, kitsCurriculum, FAQ(), faqData, Hero(), { js_kit_price, react_kit_price, complete_kit_price, js_kit_original_price, react_kit_original_price, complete_kit_original_price }, Product (+2 more)

### Community 25 - "Ui Context Menu"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 26 - "Ui Dropdown Menu"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 27 - "Ui Use Toast"
Cohesion: 0.17
Nodes (15): ToastProps, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+7 more)

### Community 28 - "Ui Table"
Cohesion: 0.21
Nodes (12): AVAILABLE_KITS, PlatformUser, RichTextEditor(), DialogFooter(), Table(), TableBody(), TableCaption(), TableCell() (+4 more)

### Community 29 - "Lib Session"
Cohesion: 0.28
Nodes (10): POST(), POST(), verifyGoogleJWT(), buildOnboardingEmail(), POST(), transporter, createSessionToken(), getSessionCookieString() (+2 more)

### Community 30 - "Components Purchase Notification"
Cohesion: 0.15
Nodes (11): dmSans, metadata, spaceGrotesk, NextAuthProvider(), indianCities, indianNames, { js_kit_price, react_kit_price, complete_kit_price }, NotificationData (+3 more)

### Community 31 - "Components React Checkout Content"
Cohesion: 0.16
Nodes (12): Features(), { js_kit_price, react_kit_price, complete_kit_price }, Kit, kits, faqs, machineCodingChallenges, modules, ReactCheckoutContent() (+4 more)

### Community 32 - "Ui Card"
Cohesion: 0.27
Nodes (8): PricingCardProps, Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle()

### Community 33 - "Hooks Use Toast"
Cohesion: 0.18
Nodes (14): ToastActionElement, Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners (+6 more)

### Community 34 - "Ui Carousel"
Cohesion: 0.20
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 35 - "Admin Users"
Cohesion: 0.18
Nodes (9): Analytics, COLORS, DataSource, DATE_PRESETS, EMAIL_TEMPLATES, RazorpayOrder, STATUS_COLORS, STATUS_LABELS (+1 more)

### Community 36 - "Api User"
Cohesion: 0.35
Nodes (9): GET(), getSessionUser(), POST(), computeCurrentStreak(), GET(), getSessionUser(), POST(), toDateStr() (+1 more)

### Community 37 - "Ui Drawer"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 38 - "Ui Form"
Cohesion: 0.25
Nodes (9): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, FormLabel(), FormMessage() (+1 more)

### Community 39 - "Nodejs Preview Q3 Function Event.png"
Cohesion: 0.27
Nodes (10): API Server (Node.js), Event (observable action that triggers functions), Function (reusable code invoked to perform a task), HTTP Request, HTTP Response, Node.js, Q3: Difference Between Function and Event, Request Received, Event Created (callout) (+2 more)

### Community 40 - "Admin Interviews"
Cohesion: 0.24
Nodes (5): AdminInterview, AdminInterviewsPage(), formatAdminDate(), STATUS_OPTIONS, toDatetimeLocal()

### Community 41 - "Ui Navigation Menu"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 42 - "Nodejs Preview Q4 Http Module.png"
Cohesion: 0.22
Nodes (10): Angular, API Server (www.api.example.com), Browser Icons (Chrome, Edge, Firefox, Opera, Safari), Client (Browser User), Express, HTTP Module (Node.js), HTTP Server, Node.js (+2 more)

### Community 43 - "Api Admin"
Cohesion: 0.28
Nodes (7): buildPlatformOnboardingEmail(), createTransporter(), EMAIL_TEMPLATES, GET(), POST(), IOrder, OrderSchema

### Community 44 - "Ui Toast"
Cohesion: 0.36
Nodes (7): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport

### Community 45 - "Ui Button"
Cohesion: 0.46
Nodes (4): Button(), buttonVariants, Calendar(), CalendarDayButton()

### Community 46 - "Ui Breadcrumb"
Cohesion: 0.25
Nodes (6): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 47 - "Nodejs Preview Q2 Events Module.png"
Cohesion: 0.46
Nodes (8): Event, Event Driven Architecture, Event Emitter, Event Handler (Event Listener), Event Loop, Events Module, Events Queue, Q2 Events Module Slide (Node.js)

### Community 48 - "Admin Kit Onboarding"
Cohesion: 0.33
Nodes (6): Buyer, KIT_OPTIONS, kitEmoji(), KitOnboardingPage(), KitStat, SendResult

### Community 49 - "Hooks Use Razorpay"
Cohesion: 0.33
Nodes (6): PurchaseDialog(), Toaster(), PaymentOptions, useRazorpay(), Window, useToast()

### Community 50 - "Ui Toggle Group"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 51 - "Components Company Wise Kit Landing"
Cohesion: 0.40
Nodes (3): companies, CompanyWiseKitLanding(), features

### Community 52 - "Scripts Seed Kits"
Cohesion: 0.33
Nodes (5): ChapterSchema, KITS, KitSchema, mongoose, TopicSchema

### Community 54 - "Ui Accordion"
Cohesion: 0.40
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 55 - "Ui Alert"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 56 - "Api Admin"
Cohesion: 0.67
Nodes (3): buildOnboardingEmail(), POST(), transporter

### Community 59 - "Public Inter.png"
Cohesion: 0.83
Nodes (4): inter.png (Geeky Frontend Logo), Browser Window Icon Motif, Circuit-Board Brain Icon Motif, Geeky Frontend (Brand)

### Community 66 - "Public Interview.png"
Cohesion: 1.00
Nodes (3): Interview Illustration (interview.png), Interview Candidate Review Screen Motif, Interviewer Figure (headset, desk)

## Knowledge Gaps
- **347 isolated node(s):** `courses`, `Kit`, `GRADIENT_OPTIONS`, `AdminInterview`, `STATUS_OPTIONS` (+342 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **102 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Ui Menubar` to `Ui Sidebar`, `Ui Chart`, `Admin Questions`, `Ui Command`, `Ui Popover`, `Ui Alert Dialog`, `Ui Context Menu`, `Ui Dropdown Menu`, `Ui Table`, `Components React Checkout Content`, `Ui Card`, `Ui Carousel`, `Admin Users`, `Ui Drawer`, `Ui Form`, `Ui Navigation Menu`, `Ui Toast`, `Ui Button`, `Ui Breadcrumb`, `Ui Toggle Group`, `Ui Accordion`, `Ui Alert`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package` to `Package`, `Ui Chart`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`, `Package`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `react` connect `Ui Chart` to `Ui Sidebar`, `Ui Carousel`, `Ui Form`, `Package`, `Ui Button`, `Hooks Use Razorpay`, `Ui Toggle Group`, `Ui Use Toast`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **What connects `courses`, `Kit`, `GRADIENT_OPTIONS` to the rest of the system?**
  _348 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Page` be split into smaller, more focused modules?**
  _Cohesion score 0.05319148936170213 - nodes in this community are weakly interconnected._
- **Should `Ui Sidebar` be split into smaller, more focused modules?**
  _Cohesion score 0.05673758865248227 - nodes in this community are weakly interconnected._
- **Should `Api Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.09292929292929293 - nodes in this community are weakly interconnected._