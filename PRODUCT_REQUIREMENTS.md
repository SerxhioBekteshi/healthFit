# Gym Management Platform - Product Requirements

## 1. Product Overview

This project is a multi-tenant SaaS platform for gym management.

The platform connects three types of users:

- Super Admin - platform owner
- Gym Owner / Manager - manages an individual gym
- Client / Member - customer of a gym

The initial application is a web application.

The backend and API must be designed so that a mobile application can be added later without requiring major architectural changes.

## 2. Business Model

The platform is intended to be sold to gym owners as a recurring SaaS subscription.

Gym owners pay the platform owner for continued access to the software.

The platform owner is responsible for:

- Hosting
- Infrastructure
- Database
- Backups
- Software updates
- Security
- Maintenance

A one-time setup fee may be introduced later, but the primary business model is recurring subscription revenue.

## 3. Multi-Tenant Model

Each gym is an independent tenant.

A gym owner can only access data belonging to their gym.

For example:

Gym A must never be able to access:

- Gym B clients
- Gym B memberships
- Gym B payments
- Gym B attendance
- Gym B programs
- Gym B products

Tenant isolation must be enforced on the backend, not only in the frontend.

## 4. User Roles

### Super Admin

The platform owner.

Can:

- View all gyms
- Create gyms
- Edit gyms
- Activate/deactivate gyms
- Manage gym owners
- View platform subscriptions
- View payments from gyms
- View platform-wide statistics
- Configure gym domains
- Manage platform settings

### Gym Owner / Manager

Manages one gym.

Can:

- Manage clients
- Manage memberships
- Create membership plans
- Activate memberships
- Record payments
- Manage attendance
- Manage workout programs
- Manage exercises
- Manage products
- Manage gym opening hours
- Register gym holidays/closures
- View gym statistics
- Manage client accounts

### Client / Member

Uses the platform as a gym member.

Can:

- View membership
- View membership expiration
- View attendance
- View attendance calendar
- View workout programs
- View available products
- Make payments
- Add money to their account (by card: Visa or Mastercard details in a card form, a one-time verification code before the payment goes through, any positive amount)
- Purchase gym products
- Change password
- View their QR/barcode
- Check into the gym
- See how many people are currently inside the gym

## 5. Gym Management

A gym owner can configure:

- Gym name
- Logo
- Address
- Contact information
- Opening hours
- Closing hours
- Holidays
- Temporary closures
- Membership plans
- Products
- Workout programs

## 6. Memberships

Gym owners can create membership plans. Plans are separated by gender (men and women) and by weekly frequency:

- 3x per week (example: 4500 ALL per month)
- 4x per week (5000 ALL)
- 5x per week (5500 ALL)
- 6x per week (6000 ALL)
- Unlimited (optional)

Subscription offers are longer terms of the same plan, priced by the gym owner, for example 4x per week for 3 months at 13000 ALL. Terms available:

- Monthly
- 3 Months
- 6 Months
- Yearly
- Visit-based memberships
- Personal training memberships

The gym owner configures the standard price list in a Membership > Configuration screen: a table with the weekly frequency across (3x, 4x, 5x, 6x per week) and the term down (1, 3, 6, 12 months), one price per cell, separately for men and women. The saving of the longer terms is shown against the monthly price. The same screen holds extras (for example a daily pass at 1000 ALL, visit packs, personal training), short notes (for example "Subscription at any hour of the day") and uploaded gym photos. The Membership menu has two entries: Members (the list of member memberships) and Configuration.

Clients see the same price list for their own gender, with the notes and photos, on their Membership page next to their current membership, and tap any price (for example 5x per week for 6 months) to subscribe with credit or card.

A membership has:

- Client
- Membership plan
- Weekly visit limit
- Start date
- End date
- Price (in ALL)
- Payment status
- Active/inactive status

A client can subscribe to a plan on their own and pay with:

- Their account credit (balance)
- Card

Cash is never a self-service option; it is only taken by gym staff at the counter.

Memberships can also be activated by the gym through:

- Cash
- Card
- Bank transfer
- Online payment
- Client account balance

Check-in respects the weekly visit limit of the membership.

## 7. Attendance

Clients can enter the gym using:

- QR code
- Barcode
- Physical membership card

The system must verify:

1. The client exists
2. The client belongs to the gym
3. The membership is active
4. The gym is currently open
5. The gym is not closed for a registered holiday/closure

After successful validation, an attendance/check-in record is created.

The system should support calculating:

- Today's attendance
- Weekly attendance
- Monthly attendance
- Attendance history
- Current number of people inside the gym

The system should be designed so checkout can be added later.

## 8. Workout Programs

Gym owners can create workout programs.

Programs can be categorized by:

- Beginner
- Intermediate
- Advanced

A program can contain:

- Exercises
- Sets
- Repetitions
- Weight
- Rest time
- Duration
- Notes
- Images/videos

Programs can eventually be assigned to individual clients.

## 9. Products

Gyms can sell products such as:

- Water
- Smoothies
- Protein shakes
- Protein bars
- Coffee
- Gym merchandise
- Other gym products

Gym owners can:

- Add products
- Edit products
- Change prices
- Manage stock
- Disable products
- View sales

## 10. Client Balance

Clients may have an account balance.

Example:

Client deposits €50.

Their balance becomes €50.

They can use the balance to purchase:

- Memberships
- Water
- Smoothies
- Other gym products

All balance changes must have a transaction history.

The system must never rely only on a single mutable balance value without maintaining financial transaction history.

## 11. Payments

The system should support:

- Cash
- Card
- Bank transfer
- Online payment
- Client balance

Online payments must be confirmed by the payment provider/backend.

The frontend must never be trusted to determine whether a payment succeeded.

Payment architecture should allow different payment providers to be integrated later.

## 12. Client Dashboard

The client dashboard should provide a quick overview:

- Current membership
- Membership expiration
- Recent attendance
- Attendance statistics
- Current gym capacity
- Available programs
- Balance
- Recent payments

The QR/barcode check-in functionality should be easily accessible.

## 13. Admin Dashboard

The Super Admin dashboard should show:

- Total gyms
- Active gyms
- Inactive gyms
- Total clients
- Active subscriptions
- Expired subscriptions
- Platform revenue
- Gym payment status

The Super Admin should be able to open an individual gym and view its information.

## 14. Gym Subscription

The gym's subscription to the platform is separate from a client's membership at the gym.

These must be treated as two different concepts.

Platform subscription:

Super Admin → Gym

Gym membership:

Gym → Client

Never combine these concepts in the data model.

## 15. Domains

Each gym should be capable of having its own subdomain.

Example:

gymname.platform.com

The platform should eventually support custom domains:

gymname.com

The Super Admin should be able to configure domain information for each gym.

## 16. Mobile Application

The mobile application is planned for a later phase.

The backend should therefore be API-first.

The same API should eventually support:

Web Application
↓
API
↑
Mobile Application

The mobile application should eventually provide:

- QR check-in
- Membership
- Attendance
- Programs
- Payments
- Notifications
- Push notifications
- Digital membership card

## 17. Technology

Node.js (Express) REST API with a React + Vite web client and a planned mobile app, PostgreSQL with Prisma, Better Auth sessions, Zod validation. Shared multi-tenancy: one database, every tenant row scoped by `gymId`. See `ARCHITECTURE.md`.
