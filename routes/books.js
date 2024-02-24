const express = require("express");
const router = new express.Router();

const ExpressError = require("../expressError");
const Book = require("../models/book");

const jsonSchema = require("jsonschema");
const bookSchema = require("../schemas/bookSchema.json");
const updateBookSchema = require("../schemas/updateBookSchema.json");

/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {  
    const validBook = jsonSchema.validate(req.body, bookSchema);
    if (!validBook.valid) {
      let errorList = validBook.errors.map(e => e.stack);
      let err = new ExpressError(errorList, 400);
      return next(err);
    }
    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    if (err.message.includes('null value in column "isbn" of relation "books" violates not-null constraint')) {
      let error = new ExpressError('ISBN is required', 400);
      return next(error);
    }
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    if ("isbn" in req.body) {
      throw new ExpressError("isbn cannot be edited!", 400);
    }
    const validBook = jsonSchema.validate(req.body, updateBookSchema);
    if (!validBook.valid) {
      let errorList = validBook.errors.map(e => e.stack);
      let err = new ExpressError(errorList, 400);
      return next(err);
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
