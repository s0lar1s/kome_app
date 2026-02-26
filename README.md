📱 Kome App
React Native – Exam Project

🛒 Overview
Kome App is a retail and loyalty mobile application developed for customers of KOME CBA supermarkets.
The app centralizes brochures, promotional codes, products, store locations, and a digital loyalty card into one mobile experience.

Its primary goal is to simplify the shopping journey by allowing users to:
    View active promotions and brochures
    Manage their loyalty card digitally
    Find nearby stores
    Create and manage a shopping list

🧭 Application Category
    Retail / Loyalty / Shopping

🔐 User Access & Permissions
    👤 Guest (Not Authenticated)
    Unauthenticated users can access:
    🏠 Home (banners, brochures, products)
    📖 Brochures (list & details)
    🎟 Promo Codes (list & details)
    🛍 Products (list with categories & pagination)
    🏪 Shops (list + map view)
    📝 Shopping List (stored locally)

⚠ The Client Cards section requires authentication.

👥 Authenticated Users
Logged-in users can additionally:
    💳 View their loyalty card
    📷 Scan a physical card using camera
    ⌨ Add card manually
    🗑 Remove card
    🆕 Create a virtual card
    🔄 Sync shopping list with backend

🔑 Authentication & Session Handling
Authentication Flow
On app start, AuthProvider loads.
    The app checks AsyncStorage for saved authentication data.
    If a valid accessToken exists → user is authenticated.
    
    On successful login/registration:
        Backend returns user + accessToken
        Data is stored in AsyncStorage.
    
    On logout:
        Auth state is cleared
        Protected screens revert to guest mode.

    Session Persistence
        Stored in AsyncStorage
        Automatically restored on app restart
        Enables automatic login

🧭 Navigation Structure
    Root Navigation
    The app uses Bottom Tab Navigation.

    Tabs:
        Home
        Brochures
        Client Cards
        Promo Codes
        Others

    Nested Navigation
        Each tab contains a Stack Navigator.
        Examples:
            ProductsList → ProductDetails
            BrochuresList → BrochureDetails
            PromoCodesList → PromoCodeDetails
            ShopsList → ShopDetails
            ClientCards → VirtualCardCreate

ClientCards tab is conditionally rendered based on authentication state.

📋 List → Details Flow
List Screens
The following list-based screens are implemented:
    Brochures
    Promo Codes
    Products (with filtering + pagination)
    Shops
User interaction:
    Tapping an item navigates to its detail screen.

Details Screens
    Navigation example:
    navigation.navigate("ProductDetails", { id: item.id })

Route parameters typically include:
    id
    Full item object (depending on screen)

🌐 Backend & Data Layer
Backend Type: Custom REST API
    Axios instance used
    Bearer token automatically attached
    Base URL from environment variables
    Timeout protection implemented

🔄 CRUD Operations
✅ Read (GET)
Data fetched for:
    Home (banners, brochures, products)
    Products
    Brochures
    Promo codes
    Shops
    Client card
    Shopping list

➕ Create (POST)
    User registration
    Add loyalty card
    Add shopping list item
    Virtual card registration

✏ Update / 🗑 Delete
Implemented in Shopping List:
    Update item
    Toggle done status
    Delete item
UI updates occur after successful API calls.
If authentication fails, local fallback is used.

🧾 Forms & Validation
Forms Implemented
    Login
    Register
    Virtual Card Creation
    Manual Card Entry
    Shopping List Add/Edit

Validation Rules
Examples of implemented validations:
    Email
        Required
        Must match regex pattern
    Password
        Required
        Minimum length enforced
    Confirm Password
        Must match password
    EGN
        Exactly 10 digits
    Post Code
        Exactly 4 digits
    Phone
        Minimum digit length
    Terms Acceptance
        Must be true before submission

📱 Native Device Features
    📷 Camera (expo-camera)
        Used for:
            Scanning loyalty card barcode
        Functionality:
            Detects barcode
            Extracts and stores card number

📍 Location & Maps (expo-location + react-native-maps)
    Used in:
        Shops screen
    Functionality:
        Requests user location permission
        Displays nearby stores
        Centers map on user position
        Opens external map applications

🔁 Typical User Flow
    User opens the app.
    Browses brochures or promo codes.
    Navigates to Client Cards tab.
    Logs in or registers.
    Adds loyalty card via scanning.
    Uses barcode at checkout.
    Creates and manages shopping list.

⚠ Error & Edge Case Handling
Authentication Errors
    Error messages displayed in Login/Register screens.
    Auth state cleared on logout.

Network Errors
    All API calls wrapped in try/catch.
    Alerts displayed for failures.
    Axios timeout configured.

Empty States
    Empty brochures message
    Empty shopping list fallback
    Client card empty state with clear call-to-action
    Offline fallback for shopping list if backend unavailable

🛠 Technologies Used
    React Native
    Expo
    React Navigation
    Axios
    AsyncStorage
    Expo Camera
    Expo Location
    React Native Maps

Project Structure (Simplified)
    src/
    ├── navigation/
    ├── screens/
    ├── contexts/
    ├── Api/
    ├── hooks/
