# Swagger API Documentation Setup

## Introduction

This project has been integrated with Swagger UI to provide interactive API documentation. Swagger allows you to view, test, and understand API endpoints easily.

## Access Swagger UI

After starting the server, you can access Swagger UI at:

```
http://localhost:3000/api-docs
```

## Features

### 1. **View All API Endpoints**
- Swagger UI displays all endpoints grouped by tags (Auth, Users, Roles)
- Each endpoint has complete descriptions of:
  - Method (GET, POST, PUT, PATCH, DELETE)
  - Parameters (path, query, body)
  - Request body schema
  - Response schema
  - Status codes

### 2. **Test API Directly**
- Click on any endpoint to view details
- Click "Try it out" button to test the API
- Enter parameters and request body
- Click "Execute" to send the request
- View the response directly in the UI

### 3. **Authentication**
- Endpoints requiring authentication have a lock icon 🔒
- To test endpoints that require authentication:
  1. Login via the `/auth/login` endpoint
  2. Copy the JWT token from the response
  3. Click the "Authorize" button at the top of the page
  4. Enter the token in format: `Bearer <your_token>`
  5. Click "Authorize"
  6. Now you can test protected endpoints

## Project Structure

### Swagger Configuration File

**`src/config/swagger.js`**
- Contains Swagger configuration and schema definitions
- Defines reusable components:
  - Security schemes (JWT Bearer token)
  - Schemas (User, Role, Error, etc.)
  - Responses (UnauthorizedError, NotFoundError, etc.)

### JSDoc Comments in Routes

Each route has a JSDoc comment with the following format:

```javascript
/**
 * @swagger
 * /path:
 *   method:
 *     summary: Short description
 *     tags: [Tag Name]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path/query/header
 *         name: parameter_name
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field: type
 *     responses:
 *       200:
 *         description: Success response
 */
```

## Adding Documentation for New Endpoints

When adding new endpoints, add JSDoc comments following the format above:

```javascript
/**
 * @swagger
 * /your-new-endpoint:
 *   post:
 *     summary: Description of your endpoint
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: example value
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         $ref: '#/components/schemas/ValidationError'
 */
router.post('/your-new-endpoint', yourController);
```

## Adding New Schemas

To add a new schema in `src/config/swagger.js`:

```javascript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid'
        },
        name: {
          type: 'string'
        }
      }
    }
  }
}
```

## Testing with Swagger UI

### Example: Test Registration and Login Flow

1. **Register** (`POST /auth/register`)
   - Click "Try it out"
   - Fill in user information
   - Click "Execute"
   - View the response with the created user

2. **Login** (`POST /auth/login`)
   - Click "Try it out"
   - Enter email and password
   - Click "Execute"
   - Copy the JWT token from the response

3. **Authorize**
   - Click the "Authorize" button at the top of the page
   - Paste the token into the field
   - Click "Authorize"

4. **Test Protected Endpoints**
   - Now you can test endpoints such as:
     - `GET /auth/profile`
     - `GET /users`
     - `GET /roles`

## Benefits of Swagger

1. **Automatic Documentation**: No need to maintain separate documentation
2. **Easy Testing**: Test APIs directly in the browser
3. **Quick API Understanding**: New developers can quickly understand the API structure
4. **Validation**: View validation rules and required fields
5. **Examples**: Pre-filled example values for all fields

## Troubleshooting

### Swagger UI Not Displaying Endpoints

1. Check if JSDoc comments have the correct format
2. Check if the `apis` path in `swagger.js` is correct
3. Restart the server to reload Swagger config

### Token Authentication Not Working

1. Ensure the token is copied completely
2. Token must still be valid (not expired)
3. Format must be: `Bearer <token>` (with space)

### Schema Not Displaying

1. Check the syntax of schema definition
2. Ensure schema is referenced correctly: `$ref: '#/components/schemas/SchemaName'`

## Best Practices

1. **Always add example values** for request body and parameters
2. **Document all possible response codes**
3. **Use $ref** for schemas and responses that are used multiple times
4. **Group endpoints by tags** for easy searching
5. **Add detailed descriptions** for complex fields

## References

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
