/**
 * Source: Inspired by shsarv/TravelYaari-react validation patterns
 * Request validation using express-validator
 */
import { body, param, query, validationResult } from "express-validator";
// Validation middleware to check for errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            errors: errors.array(),
        });
    }
    next();
};
// Location creation validation
export const createLocationValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required")
        .isLength({ min: 10 })
        .withMessage("Description must be at least 10 characters"),
    body("location")
        .trim()
        .notEmpty()
        .withMessage("Location is required"),
    body("image")
        .trim()
        .notEmpty()
        .withMessage("Image URL is required"),
    //.isURL()
    //.withMessage("Image must be a valid URL"),
    body("rating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Rating must be between 0 and 5"),
    validate,
];
// Location update validation
export const updateLocationValidation = [
    param("id")
        .isInt()
        .withMessage("Invalid location ID"),
    body("name")
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage("Description must be at least 10 characters"),
    body("location")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Location cannot be empty"),
    body("image")
        .optional()
        .trim(),
    //.isURL()
    //.withMessage("Image must be a valid URL"),
    body("rating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Rating must be between 0 and 5"),
    validate,
];
// ID parameter validation
export const idValidation = [
    param("id")
        .isInt()
        .withMessage("Invalid location ID"),
    validate,
];
// Query parameter validation for searching/filtering
export const queryValidation = [
    query("search")
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage("Search query must be at least 2 characters"),
    query("minRating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Minimum rating must be between 0 and 5"),
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    validate,
];
//# sourceMappingURL=locationValidator.js.map