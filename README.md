# Design Profit Partner

I use Printify and Zazzle for my online stores: Printify for everything from apparel to bags, jewelry, and home goods, and Zazzle for stationery. 

I need an app to keep track of all my product designs, which store they are in, retail price, profit amount / commission, product photos, listing information (such as product description and tags), and production notes.

Key structure and features:
1. Design & Listing Organization:
   - I reuse artwork depending on what it is, so have a master Artwork / Design view with linked store listings underneath each design, while also supporting standalone product listings.
   - For each listing, track: Store (Printify or Zazzle, with store-specific badges), Product Type / Category (apparel, bags, jewelry, home goods, stationery, cards, etc.), Status (Draft, Active, Archived).
2. Financials & Profit Calculator:
   - Printify listings: Retail Price - Base / Production Cost = Net Profit and Margin %.
   - Zazzle listings: Retail Price and Royalty / Commission Rate % to calculate Net Profit / royalty payout per unit.
   - Summary stat cards at the top: Total Artworks, Active Listings, and Average Profit per item.
3. Listing Drawer & Details:
   - Product mockup and detail photos.
   - Listing copy: Title, Product Description, and Search Tags (with quick copy-to-clipboard for tags and description).
   - Direct store link / URL and SKU.
   - Production notes (print provider, DPI check, variant notes).
4. Search & Filters:
   - Filter by store (All, Printify, Zazzle), product category, or search by tag/keyword.
5. Branding & Color Palette:
   - Brand the entire interface with "The Raw Palette" from the attached image:
     - Primary Colors: Teal Magnolias (#1A7A72), Co-Ral (#E8634A), All That Glitters (#C9943A), The Mile (#4A7A3A)
     - Accent & Canvas: Warm Ivory (#FFF5E8) background canvas, Bright Aqua (#58C9CA), and Black/Charcoal (#161616) for crisp typography.
     - Include artistic, polished styling that feels creative and professional.
   - Seed with realistic sample products across Printify and Zazzle to show the system in action.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://design-profit-partner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/084505ad-a146-41a2-9fb0-aa6499e2c21c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
