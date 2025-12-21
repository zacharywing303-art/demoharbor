# Prompt: Build a Server-Side Tracking Demo (React + Node.js)

**Context:** I want to build a demo project to understand how Server-Side Tracking (SST) works. Instead of the browser sending data directly to Google Analytics or Facebook Pixel, the browser will send data to my own Node.js server, and then the server will forward it to a "Mock Analytics API".

**Tech Stack:**
- **Frontend:** React (Vite)
- **Backend:** Node.js (Express)
- **Communication:** Axios

**Project Structure & Requirements:**

1. **Frontend (React):**
   - Create a simple Landing Page for an E-commerce store.
   - Add a "Buy Now" button.
   - When the button is clicked, it should trigger an event.
   - **Crucial:** The event data should NOT be sent to a third-party URL. It should be sent to `http://localhost:5000/track-event` (Our Backend).
   - Send payload: `{ eventName: 'purchase', product: 'Laptop', price: 1200, currency: 'USD' }`.

2. **Backend (Node.js/Express):**
   - Create an Express server running on port 5000.
   - Create a POST endpoint `/track-event`.
   - **Data Enrichment (Server-side):** When the request hits this endpoint, the server should:
     - Capture the User's IP address and User-Agent from the request headers.
     - Add a secret `API_KEY` (simulating a private key that shouldn't be exposed in the browser).
     - Log the complete "Enriched Data" in the console.
   - **Forwarding (The SST Part):** Use `axios` to forward this enriched data to a Mock API (e.g., `https://jsonplaceholder.typicode.com/posts` or a dummy webhook URL).

3. **Demonstration of Benefits:**
   - In the code comments, explain how this bypasses Ad-blockers (since the request goes to our own domain) and keeps the API Key secure.

**Deliverables:**
- `server.js` (Express setup with the tracking logic)
- `App.jsx` (React frontend with the tracking button)
- `package.json` for both or instructions to install dependencies.

Please generate the complete code for both the frontend and backend.