# 🏨 Luxora Hotels

A premium hotel discovery and booking web application built with vanilla HTML, CSS, and JavaScript — integrated with a live REST API.

---

## 🌐 Live API

- **Base URL:** https://demohotelsapi.pythonanywhere.com/
- **Hotels Endpoint:** https://demohotelsapi.pythonanywhere.com/hotels/

---

## ✨ Features

- 🔍 **Search** hotels by name or city in real-time
- 🏙️ **Filter by City** — 12 Indian cities supported
- 💰 **Price Range Filter** — min & max price per night
- ⭐ **Rating Filter** — filter by minimum rating
- 🔃 **Sort** by price or rating (ascending / descending)
- 🃏 **Grid & List View** toggle for hotel listings
- 📖 **Hotel Detail Page** — full photo gallery, description, and rating
- 📅 **Booking Flow** — select check-in, check-out, adults, and rooms
- ❤️ **Wishlist** — save favourite hotels locally
- 🗓️ **My Bookings** — view and cancel confirmed bookings
- 🔔 **Toast Notifications** for all user actions
- 📱 **Fully Responsive** — works on mobile, tablet, and desktop
- ⚡ **Shimmer Loading** skeleton while data fetches

---

## 🛠️ Tech Stack

| Layer      | Technology         |
|------------|--------------------|
| Structure  | HTML5              |
| Styling    | Vanilla CSS3       |
| Logic      | Vanilla JavaScript |
| Icons      | Lucide Icons (CDN) |
| Fonts      | Google Fonts (Inter, Playfair Display) |
| API        | REST (Fetch API)   |
| Storage    | localStorage       |

---

## 📁 Project Structure

```
fsd_project_2/
├── index.html      # App structure and markup
├── style.css       # All styling (light theme, responsive)
├── app.js          # API calls, state management, UI logic
└── README.md       # Project documentation
```

---

## 🚀 Getting Started

### Run Locally

```bash
# Clone the repository
git clone https://github.com/krish2413179-prog/fsd_project_2.git

# Navigate into the folder
cd fsd_project_2

# Start a local server
python -m http.server 8080

# Open in browser
http://localhost:8080/index.html
```

> No build tools or npm required — it's pure HTML/CSS/JS.

---

## 🔗 API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hotels/` | Fetch all hotels |
| GET | `/hotels/{id}/` | Fetch single hotel detail |
| GET | `/hotels/?search=query` | Search by name or location |
| GET | `/hotels/?location=City` | Filter by city |
| GET | `/hotels/?min_price=X&max_price=Y` | Filter by price range |
| GET | `/hotels/?min_rating=X` | Filter by minimum rating |
| GET | `/hotels/?order_by=price` | Sort results |

---
