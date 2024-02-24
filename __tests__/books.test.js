/** Integration tests for books route */

process.env.NODE_ENV = "test"; 

const request = require('supertest');
const app = require('../app');
const db = require('../db');


let book_data;

beforeEach(async () => {
    await db.query("DELETE FROM books");
    const result = await db.query(
        `INSERT INTO books (
            isbn,
            amazon_url,
            author,
            language,
            pages,
            publisher,
            title,
            year) 
         VALUES ('1234567890','https://amazon.com/book', 'Liv', 'English', 100, 'Publishing Company', 'How to Quilt', 2024) 
         RETURNING 
            isbn,
            amazon_url,
            author,
            language,
            pages,
            publisher,
            title,
            year`
    );
    book_data = result.rows[0];
});

describe("GET /books", () => {
    test("Gets a list of all books", async () => {
        const res = await request(app).get('/books');
        const books = res.body.books;
        expect(res.statusCode).toBe(200);
        expect(books).toHaveLength(1);
    })
})

describe("GET /books/:isbn", () => {
    test("Gets a book by its id", async () => {
        const res = await request(app).get(`/books/${book_data.isbn}`)
        expect(res.statusCode).toBe(200);
        expect(res.body.book.isbn).toEqual('1234567890');
    })
    test("Responds with 404 if isbn is missing", async () => {
        const res = await request(app).get('/books/1234098765')
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /books", () => {
    test("Adds new book to books table", async () => {
        const res = await request(app)
            .post('/books')
            .send({
                isbn: '1111111111',
                amazon_url: 'https://amazon.com/book2',
                author: 'Jane Doe',
                language: 'Spanish',
                pages: 235,
                publisher: 'Generic Publishing House',
                title: 'Mi Nombre Es',
                year: 2022
            })
        expect(res.statusCode).toBe(201);
        expect(res.body.book.title).toBe('Mi Nombre Es');
    })
    test("Prevents creation of book without required data", async () => {
        const res = await request(app)
            .post('/books')
            .send({ isbn: '1234567892' });
        expect(res.statusCode).toBe(400);
    })
})

describe("PUT /books/:isbn", () => {
    test("Update single book information", async () => {
        const res = await request(app)
            .put(`/books/${book_data.isbn}`)
            .send({
                amazon_url: "https://amazon.com/book3",
                author: "Liv",
                language: "English",
                pages: 100,
                publisher: "Generic Publishing Company",
                title: "How to Quilt",
                year: 2023
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.book.isbn).toEqual('1234567890');
        expect(res.body.book.year).toBe(2023);
    })
    test("Responds with 404 for invalid update", async () => {
        const res = await request(app)
            .put(`/books/not-a-book`);
        expect(res.statusCode).toBe(400);
    })
})

describe("DELETE /books/:isbn", () => {
    test("Delete a book with corresponding isbn", async () => {
        const res = await request(app)
            .delete(`/books/${book_data.isbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({message: 'Book deleted'});
    })
})

afterAll(async () => {
    await db.end();
})