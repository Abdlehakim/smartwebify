# E-Commerce Blog Project

This project is structured with separate repositories for the backend, frontend, and frontendadmin managed using Git submodules.

## 👥 Cloning the Repository with Submodules

To clone this repository along with all submodules, run:

```sh
git clone --recurse-submodules <root-repo-url>
```

If you've already cloned the repository but the submodules are empty, initialize and update them with:

```sh
git submodule update --init --recursive
```

To fetch the latest updates from the submodules, use:

```sh
git submodule update --remote --merge
```

## 🚀 Project Structure

- `backend/` → Handles API, authentication, and database (MongoDB)
- `frontend/` → The main Next.js frontend for the e-commerce site
- `frontendadmin/` → Admin panel for managing products, users, and orders

## 🛠 Setting Up the Project

1. **Install dependencies** for each module:

   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   cd ../frontendadmin && npm install
   ```

2. **Run each service**:
  
   ```sh
   cd backend && npm run dev
   cd ../frontend && npm run dev
   cd ../frontendadmin && npm run dev
   ```

   ```sh

   git submodule foreach 'git add . && git commit -m "Update submodule" && git push'
   git submodule foreach 'git checkout main'
   git add .
   git commit -m "Update submodule references"
   git push origin main
## 📝 Notes

- Make sure you have Node.js and MongoDB installed.
- Each repository has its own `.env` file for configuration.
- Use `git submodule update --remote --merge` to keep all submodules up to date.

---

### ✨ Happy Coding! 🚀
