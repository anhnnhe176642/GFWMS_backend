import { expect, describe, it } from "vitest";
import Joi from "joi";
import {
  createMultiValueFilterSchema,
  createSortBySchema,
  pageSchema,
  limitSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  fullnameSchema,
  genderSchema,
  addressSchema,
  dobSchema,
  roleSchema,
  userStatusSchema,
  uuidSchema,
} from "../src/validations/common.validation.js";

describe("createMultiValueFilterSchema", () => {
  // schemas for validation tests
  const stringSchema = Joi.string().min(2);
  const intSchema = Joi.number().integer().min(1).messages({
    "number.base": "không phải là số hợp lệ",
    "number.integer": "không phải là số hợp lệ",
    "number.min": "không phải là số hợp lệ",
  });
  const floatSchema = Joi.number().precision(2).min(0).messages({
    "number.base": "không phải là số hợp lệ",
    "number.min": "không phải là số hợp lệ",
  });
  const negativeSchema = Joi.number().negative().messages({
    "number.base": "không phải là số hợp lệ",
    "number.negative": "không phải là số hợp lệ",
  });

  // Define schemas for reuse outside individual tests
  const nameFilter = createMultiValueFilterSchema(stringSchema, "name");
  const ageFilter = createMultiValueFilterSchema(intSchema, "age");
  const priceFilter = createMultiValueFilterSchema(floatSchema, "price");
  const tempFilter = createMultiValueFilterSchema(negativeSchema, "temperature");
  const idFilter = createMultiValueFilterSchema(uuidSchema, "id");

  describe('Strings', () => {
    it('Normal - comma separated valid strings', () => {
      const { error, value } = nameFilter.validate('John,Jane,Bob');
      expect(error).toBeUndefined();
      expect(value).toEqual(['John', 'Jane', 'Bob']);
    });

    it('Boundary - minimum length strings', () => {
      const { error, value } = nameFilter.validate('Jo,Mi');
      expect(error).toBeUndefined();
      expect(value).toEqual(['Jo', 'Mi']);
    });

    it('Abnormal - invalid format (empty value between commas)', () => {
      const { error } = nameFilter.validate('John,,A');
      expect(error).toBeDefined();
      expect(error.message).toContain(
        'phải là giá trị hợp lệ hoặc nhiều giá trị cách nhau bởi dấu phẩy'
      );
    });
  });

  // Test with number schema
  describe('Integers', () => {
    it('Normal - comma separated integers', () => {
      const { error, value } = ageFilter.validate('6,7,8');
      expect(error).toBeUndefined();
      expect(value).toEqual([6, 7, 8]);
    });

    it('Boundary - minimum allowed value', () => {
      const { error, value } = ageFilter.validate('1,10');
      expect(error).toBeUndefined();
      expect(value).toEqual([1, 10]);
    });

    it('Abnormal - contains below-min or non-integer values', () => {
      const { error: err1 } = ageFilter.validate('0,2,3');
      expect(err1).toBeDefined();
      expect(err1.message).toContain('không phải là số hợp lệ');

      const { error: err2 } = ageFilter.validate('25,abc,35');
      expect(err2).toBeDefined();
      expect(err2.message).toContain('không phải là số hợp lệ');
    });
  });
  // Test with float number schema
  describe('Floats', () => {
    it('Normal - comma separated floats', () => {
      const { error, value } = priceFilter.validate('19.99,25.50,30.00');
      expect(error).toBeUndefined();
      expect(value).toEqual([19.99, 25.5, 30.0]);
    });

    it('Boundary - min value allowed (0)', () => {
      const { error, value } = priceFilter.validate('0,100.00');
      expect(error).toBeUndefined();
      expect(value).toEqual([0, 100.0]);
    });

    it('Abnormal - negative or non-number present', () => {
      const { error: err1 } = priceFilter.validate('19.99,-5,30.00');
      expect(err1).toBeDefined();
      expect(err1.message).toContain('không phải là số hợp lệ');

      const { error: err2 } = priceFilter.validate('19.99,abc,30.00');
      expect(err2).toBeDefined();
      expect(err2.message).toContain('không phải là số hợp lệ');
    });
  });

  //Test with negative number schema
  describe('Negative numbers', () => {
    it('Normal - comma separated negative numbers', () => {
      const { error, value } = tempFilter.validate('-5,-10.5,-20');
      expect(error).toBeUndefined();
      expect(value).toEqual([-5, -10.5, -20]);
    });

    it('Boundary - near zero negatives', () => {
      const { error, value } = tempFilter.validate('-0.1,-1');
      expect(error).toBeUndefined();
      expect(value).toEqual([-0.1, -1]);
    });

    it('Abnormal - positive or non-number present', () => {
      const { error: err1 } = tempFilter.validate('-5,10,-20');
      expect(err1).toBeDefined();
      expect(err1.message).toContain('không phải là số hợp lệ');

      const { error: err2 } = tempFilter.validate('-5,abc,-20');
      expect(err2).toBeDefined();
      expect(err2.message).toContain('không phải là số hợp lệ');
    });
  });

  // Test with UUID schema
  const uuids = "f47ac10b-58cc-4372-a567-0e02b2c3d479,550e8400-e29b-41d4-a716-446655440000";

  describe('UUIDs', () => {
    it('Normal - multiple valid UUIDs', () => {
      const { error, value } = idFilter.validate(uuids);
      expect(error).toBeUndefined();
      expect(value).toEqual(uuids.split(','));
    });

    it('Boundary - single UUID', () => {
      const { error, value } = idFilter.validate('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(error).toBeUndefined();
      expect(value).toEqual(['f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('Abnormal - invalid UUID in list', () => {
      const { error } = idFilter.validate('not-a-uuid,550e8400-e29b-41d4-a716-446655440000');
      expect(error).toBeDefined();
      expect(error.message).toContain('ID phải là UUID hợp lệ');
    });
  });

  // Duplicate checks moved into grouped tests above

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

describe("Common single value schemas", () => {
  it("validates correct page", () => {
    const { error, value } = pageSchema.validate(2);
    expect(error).toBeUndefined();
    expect(value).toBe(2);
  });
  it("rejects invalid page (zero)", () => {
    const { error } = pageSchema.validate(0);
    expect(error).toBeDefined();
    expect(error.message).toContain("Page phải lớn hơn 0");
  });

  it("validates correct limit", () => {
    const { error, value } = limitSchema.validate(50);
    expect(error).toBeUndefined();
    expect(value).toBe(50);
  });
  it("rejects invalid limit (over 100)", () => {
    const { error } = limitSchema.validate(101);
    expect(error).toBeDefined();
    expect(error.message).toContain("Limit không được vượt quá 100");
  });

  it("validates correct email", () => {
    const { error, value } = emailSchema.validate("test@example.com");
    expect(error).toBeUndefined();
    expect(value).toBe("test@example.com");
  });
  it("rejects invalid email", () => {
    const { error } = emailSchema.validate("not-an-email");
    expect(error).toBeDefined();
    expect(error.message).toContain("Email không hợp lệ");
  });

  it("validates correct password", () => {
    const { error, value } = passwordSchema.validate("1234567");
    expect(error).toBeUndefined();
    expect(value).toBe("1234567");
  });
  it("rejects invalid password (short)", () => {
    const { error } = passwordSchema.validate("123");
    expect(error).toBeDefined();
    expect(error.message).toContain("Password phải có ít nhất 6 ký tự");
  });

  it("validates correct phone", () => {
    const { error, value } = phoneSchema.validate("0123456789");
    expect(error).toBeUndefined();
    expect(value).toBe("0123456789");
  });
  it("rejects invalid phone (letters)", () => {
    const { error } = phoneSchema.validate("abc1234567");
    expect(error).toBeDefined();
    expect(error.message).toContain("Số điện thoại không hợp lệ");
  });

  it("validates correct fullname", () => {
    const { error, value } = fullnameSchema.validate("Nguyen Van A");
    expect(error).toBeUndefined();
    expect(value).toBe("Nguyen Van A");
  });
  it("rejects invalid fullname (too long)", () => {
    const { error } = fullnameSchema.validate("A".repeat(101));
    expect(error).toBeDefined();
    expect(error.message).toContain("Họ tên không được vượt quá 100 ký tự");
  });

  it("validates correct gender", () => {
    const { error, value } = genderSchema.validate("MALE");
    expect(error).toBeUndefined();
    expect(value).toBe("MALE");
  });
  it("rejects invalid gender", () => {
    const { error } = genderSchema.validate("UNKNOWN");
    expect(error).toBeDefined();
    expect(error.message).toContain(
      "Giới tính phải là MALE hoặc FEMALE"
    );
  });

  it("validates correct address", () => {
    const { error, value } = addressSchema.validate("123 Đường ABC");
    expect(error).toBeUndefined();
    expect(value).toBe("123 Đường ABC");
  });
  it("rejects invalid address (too long)", () => {
    const { error } = addressSchema.validate("A".repeat(256));
    expect(error).toBeDefined();
    expect(error.message).toContain("Địa chỉ không được vượt quá 255 ký tự");
  });

  it("validates correct dob", () => {
    const { error, value } = dobSchema.validate("2000-01-01");
    expect(error).toBeUndefined();
    expect(new Date(value).getFullYear()).toBe(2000);
  });
  it("rejects invalid dob (future)", () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const { error } = dobSchema.validate(future);
    expect(error).toBeDefined();
    expect(error.message).toContain(
      "Ngày sinh không được lớn hơn ngày hiện tại"
    );
  });

  it("validates correct role", () => {
    const { error, value } = roleSchema.validate("ADMIN");
    expect(error).toBeUndefined();
    expect(value).toBe("ADMIN");
  });
  it("rejects invalid role (too long)", () => {
    const { error } = roleSchema.validate("A".repeat(11));
    expect(error).toBeDefined();
    expect(error.message).toContain("Role name không được vượt quá 10 ký tự");
  });

  it("validates correct user status", () => {
    const { error, value } = userStatusSchema.validate("ACTIVE");
    expect(error).toBeUndefined();
    expect(value).toBe("ACTIVE");
  });
  it("rejects invalid user status", () => {
    const { error } = userStatusSchema.validate("DELETED");
    expect(error).toBeDefined();
    expect(error.message).toContain(
      "Trạng thái phải là ACTIVE, INACTIVE hoặc SUSPENDED"
    );
  });

  it("validates correct uuid", () => {
    const { error, value } = uuidSchema.validate(
      "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    );
    expect(error).toBeUndefined();
    expect(value).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
  });
  it("rejects invalid uuid", () => {
    const { error } = uuidSchema.validate("not-a-uuid");
    expect(error).toBeDefined();
    expect(error.message).toContain("ID phải là UUID hợp lệ");
  });

  it("validates and transforms role to uppercase", () => {
    const { error, value } = roleSchema.validate("admin");
    expect(error).toBeUndefined();
    expect(value).toBe("ADMIN");
  });

  it("transforms role with mixed case to uppercase", () => {
    const { error, value } = roleSchema.validate("AdMiN");
    expect(error).toBeUndefined();
    expect(value).toBe("ADMIN");
  });
});

describe("createMultiValueFilterSchema with uppercase transform", () => {
  // Test với schema có .uppercase()
  const statusSchema = Joi.string()
    .trim()
    .uppercase()
    .valid('ACTIVE', 'INACTIVE', 'SUSPENDED')
    .messages({
      'any.only': 'Trạng thái không hợp lệ'
    });
  
  const statusFilter = createMultiValueFilterSchema(statusSchema, 'status');

  it("transforms single lowercase value to uppercase", () => {
    const { error, value } = statusFilter.validate('active');
    expect(error).toBeUndefined();
    expect(value).toEqual(['ACTIVE']);
  });

  it("transforms multiple lowercase values to uppercase", () => {
    const { error, value } = statusFilter.validate('active,inactive,suspended');
    expect(error).toBeUndefined();
    expect(value).toEqual(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
  });

  it("transforms mixed case values to uppercase", () => {
    const { error, value } = statusFilter.validate('AcTiVe,InAcTiVe');
    expect(error).toBeUndefined();
    expect(value).toEqual(['ACTIVE', 'INACTIVE']);
  });

  it("transforms with whitespace and different cases", () => {
    const { error, value } = statusFilter.validate(' active , INACTIVE , Suspended ');
    expect(error).toBeUndefined();
    expect(value).toEqual(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
  });

  it("rejects invalid values after uppercase transform", () => {
    const { error } = statusFilter.validate('active,invalid,suspended');
    expect(error).toBeDefined();
    expect(error.message).toContain('Trạng thái không hợp lệ');
  });
});
