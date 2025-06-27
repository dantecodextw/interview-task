## 📝 Developer Task: Notes API using Node.js and JSON

### 📌 Objective

Build a simple yet slightly advanced **RESTful Notes API** using **Node.js** and **Express.js**, where all data is stored in a local **JSON file** (no database). This task will test your ability to work with core backend concepts like routing, file storage, validation, and query handling.

---

### 📚 Requirements

You need to build an API to manage notes with the following fields:

- `id`: Unique identifier (use `uuid`)
- `title`: String (max 100 chars)
- `content`: String
- `createdAt`: ISO timestamp
- `deleted`: Boolean (for soft delete)

Data should be stored in a local file `notes.json` using Node’s `fs` module.

---

### 🔧 Endpoints to Implement

| Method | Endpoint     | Description                                       |
|--------|--------------|---------------------------------------------------|
| GET    | `/notes`     | List all notes with filters                       |
| GET    | `/notes/:id` | Get a single note by ID                           |
| POST   | `/notes`     | Create a new note                                 |
| PUT    | `/notes/:id` | Update a note                                     |
| DELETE | `/notes/:id` | Soft delete a note by setting `deleted: true`     |

---

### 📥 Additional Functional Requirements

1. **Validation**
   - `title` must be a non-empty string and ≤ 100 characters
   - `content` must be a non-empty string

2. **Timestamps**
   - Set `createdAt` automatically on creation

3. **Pagination and Search (`GET /notes`)**
   - Optional query params: `?page=1&limit=5`
   - Optional search: `?search=meeting` (search in title or content)

4. **Soft Delete**
   - Deleted notes should not appear in listing unless `?includeDeleted=true` is passed

---

### 📦 Tech Stack Allowed

- Node.js
- Express.js
- `uuid` npm package
- `fs` (Node’s file system module)

> ❌ No use of any databases (MongoDB, PostgreSQL, etc.)

---

### 🧪 Example Request & Response

#### **POST /notes**

```json
Request Body:
{
  "title": "Project Plan",
  "content": "Define MVP and deadlines"
}
````

```json
Response:
{
  "id": "a1b2c3d4",
  "title": "Project Plan",
  "content": "Define MVP and deadlines",
  "createdAt": "2025-06-27T08:15:30.000Z",
  "deleted": false
}
```

#### **GET /notes?page=1\&limit=2\&search=project**

```json
[
  {
    "id": "a1b2c3d4",
    "title": "Project Plan",
    "content": "Define MVP and deadlines",
    "createdAt": "2025-06-27T08:15:30.000Z",
    "deleted": false
  }
]
```
