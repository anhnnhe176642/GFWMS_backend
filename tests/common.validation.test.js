import { expect, describe, it } from "vitest";
import Joi from "joi";
import {
  createMultiValueFilterSchema,
  createSortBySchema,
  uuidSchema,
} from "../src/validations/common.validation.js";

describe("createMultiValueFilterSchema", () => {
  // Test with string schema
  it("validates and converts comma-separated strings", () => {
    const nameFilter = createMultiValueFilterSchema(
      Joi.string().min(2),
      "name"
    );
    const { error, value } = nameFilter.validate("John,Jane,Bob");
    expect(error).toBeUndefined();
    expect(value).toEqual(["John", "Jane", "Bob"]);
  });

  // Test with number schema
  it("validates and converts comma-separated numbers", () => {
    const ageFilter = createMultiValueFilterSchema(
      Joi.number().integer().min(1),
      "age"
    );
    const { error, value } = ageFilter.validate("25,30,35");
    expect(error).toBeUndefined();
    expect(value).toEqual([25, 30, 35]);
  });

  // Test with UUID schema
  it("validates and converts comma-separated UUIDs", () => {
    const uuids =
      "f47ac10b-58cc-4372-a567-0e02b2c3d479,550e8400-e29b-41d4-a716-446655440000";
    const idFilter = createMultiValueFilterSchema(uuidSchema, "id");
    const { error, value } = idFilter.validate(uuids);
    expect(error).toBeUndefined();
    expect(value).toEqual(uuids.split(","));
  });

  // Test invalid number input
  it("rejects invalid number values", () => {
    const ageFilter = createMultiValueFilterSchema(
      Joi.number().integer().min(1),
      "age"
    );
    const { error } = ageFilter.validate("25,abc,35");
    expect(error).toBeDefined();
    expect(error.message).toContain("không phải là số hợp lệ");
  });

  // Test invalid format
  it("rejects invalid comma-separated format", () => {
    const nameFilter = createMultiValueFilterSchema(
      Joi.string().min(2),
      "name"
    );
    const { error } = nameFilter.validate("John,,Jane");
    expect(error).toBeDefined();
    expect(error.message).toContain(
      "phải là giá trị hợp lệ hoặc nhiều giá trị cách nhau bởi dấu phẩy"
    );
  });

  // Test validation of individual values
  it("validates each individual value against the schema", () => {
    const nameFilter = createMultiValueFilterSchema(
      Joi.string()
        .min(3)
        .messages({ "string.min": "Tên phải có ít nhất 3 ký tự" }),
      "name"
    );
    const { error } = nameFilter.validate("John,Jo,Bob");
    expect(error).toBeDefined();
    expect(error.message).toContain("Tên phải có ít nhất 3 ký tự");
  });
});

describe("createSortBySchema", () => {
  const allowedFields = ["name", "age", "createdAt"];

  it("accepts single allowed field", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error, value } = sortSchema.validate("name");
    expect(error).toBeUndefined();
    expect(value).toBe("name");
  });

  it("accepts multiple allowed fields", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error, value } = sortSchema.validate("name,age");
    expect(error).toBeUndefined();
    expect(value).toBe("name,age");
  });

  it("rejects fields not in whitelist", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error } = sortSchema.validate("name,password");
    expect(error).toBeDefined();
    expect(error.message).toContain("không được phép sort");
    expect(error.message).toContain(allowedFields.join(", "));
  });

  it("rejects invalid field format", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error } = sortSchema.validate("name!@#");
    expect(error).toBeDefined();
    expect(error.message).toContain("Sort by phải là tên field hợp lệ");
  });

  it("allows optional/undefined values", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error, value } = sortSchema.validate(undefined);
    expect(error).toBeUndefined();
    expect(value).toBeUndefined();
  });

  it("rejects input with whitespace", () => {
    const sortSchema = createSortBySchema(allowedFields);
    const { error } = sortSchema.validate(" name , age ");
    expect(error).toBeDefined();
    expect(error.message).toContain("Sort by phải là tên field hợp lệ");
  });
});
