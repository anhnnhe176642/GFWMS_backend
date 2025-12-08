import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import process from 'process';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// =============================================
// VIETNAMESE DATA ARRAYS
// =============================================

// Họ người Việt
const hoViet = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Mai', 'Tô',
  'Lương', 'Châu', 'Tăng', 'Đoàn', 'Lâm', 'Hà', 'Cao', 'Thái', 'Kiều', 'Quách'
];

// Tên đệm người Việt
const tenDem = [
  'Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Quốc', 'Thanh', 'Ngọc', 'Hoàng', 'Kim',
  'Xuân', 'Thu', 'Hà', 'Phương', 'Anh', 'Bảo', 'Gia', 'Hải', 'Thiên', 'Tường'
];

// Tên người Việt
const tenViet = [
  'An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phúc', 'Giang', 'Hạnh', 'Hùng', 'Kiên',
  'Lan', 'Long', 'Mai', 'Nam', 'Oanh', 'Phong', 'Quang', 'Sơn', 'Tâm', 'Trung',
  'Tú', 'Uyên', 'Việt', 'Xuân', 'Yến', 'Hoa', 'Linh', 'Thảo', 'Hiếu', 'Đạt',
  'Tuấn', 'Hưng', 'Duy', 'Khoa', 'Thành', 'Nhung', 'Hương', 'Trang', 'Nhật', 'Khánh'
];

// Tên đường
const tenDuong = [
  'Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Lý Thường Kiệt',
  'Đinh Tiên Hoàng', 'Ngô Quyền', 'Quang Trung', 'Lê Đại Hành', 'Trần Phú',
  'Nguyễn Trãi', 'Lê Văn Sỹ', 'Cách Mạng Tháng 8', 'Võ Văn Tần', 'Nam Kỳ Khởi Nghĩa',
  'Pasteur', 'Nguyễn Thị Minh Khai', 'Điện Biên Phủ', 'Nguyễn Văn Trỗi', 'Phan Xích Long',
  'Hoàng Văn Thụ', 'Cộng Hòa', 'Trường Chinh', 'Lạc Long Quân', 'Âu Cơ',
  'Tô Hiến Thành', 'Ba Tháng Hai', 'Lý Tự Trọng', 'Phạm Ngũ Lão', 'Bùi Viện'
];

// Tên quận/huyện
const tenQuan = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
  'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp',
  'Quận Tân Bình', 'Quận Tân Phú', 'Quận Phú Nhuận', 'Quận Thủ Đức',
  'Quận Hoàn Kiếm', 'Quận Ba Đình', 'Quận Đống Đa', 'Quận Cầu Giấy',
  'Quận Thanh Xuân', 'Quận Hai Bà Trưng', 'Quận Long Biên', 'Quận Hà Đông',
  'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn'
];

// Tên thành phố
const tenThanhPho = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Biên Hòa', 'Nha Trang', 'Huế', 'Buôn Ma Thuột', 'Quy Nhơn',
  'Vũng Tàu', 'Thái Nguyên', 'Nam Định', 'Thanh Hóa', 'Vinh',
  'Đà Lạt', 'Phan Thiết', 'Rạch Giá', 'Long Xuyên', 'Mỹ Tho'
];

// Tên công ty vải
const tenCongTyVai = [
  'Dệt May Việt Tiến', 'Vải Phong Phú', 'Dệt Thành Công', 'Vải Đông Á', 'Dệt Nam Định',
  'Vải Hòa Thọ', 'Dệt Việt Thắng', 'Vải Sài Gòn', 'Dệt An Phước', 'Vải Bình Minh',
  'Dệt May 10', 'Vải Việt Nam', 'Dệt Đông Xuân', 'Vải Hà Nội', 'Dệt Nhà Bè',
  'Vải Thiên Long', 'Dệt Phước Long', 'Vải Tân Tiến', 'Dệt Minh Hưng', 'Vải Kim Cương'
];

// Loại hình công ty
const loaiCongTy = ['TNHH', 'Cổ Phần', 'Tư Nhân', 'Liên Doanh', 'Xuất Nhập Khẩu'];

// Tên loại vải tiếng Việt
const tenLoaiVai = [
  'Vải Cotton', 'Vải Lụa', 'Vải Polyester', 'Vải Kaki', 'Vải Denim',
  'Vải Len', 'Vải Kate', 'Vải Thun', 'Vải Linen', 'Vải Nhung',
  'Vải Chiffon', 'Vải Ren', 'Vải Satin', 'Vải Tweed', 'Vải Velvet',
  'Vải Organza', 'Vải Taffeta', 'Vải Crepe', 'Vải Jersey', 'Vải Flannel',
  'Vải Canvas', 'Vải Corduroy', 'Vải Chambray', 'Vải Oxford', 'Vải Poplin',
  'Vải Voile', 'Vải Tulle', 'Vải Brocade', 'Vải Jacquard', 'Vải Fleece',
  'Vải Nỉ', 'Vải Cotton Pha', 'Vải Kẻ Sọc', 'Vải Caro', 'Vải Hoa',
  'Vải Trơn', 'Vải In Họa Tiết', 'Vải Dệt Kim', 'Vải Dệt Thoi', 'Vải Tơ Tằm'
];

// Đặc điểm vải
const dacDiemVai = [
  'Cao cấp', 'Mềm mịn', 'Thoáng mát', 'Co giãn', 'Chống nhăn',
  'Thấm hút tốt', 'Bền màu', 'Dễ giặt', 'Nhẹ nhàng', 'Sang trọng',
  'Chống nước', 'Chống tĩnh điện', 'Thân thiện môi trường', 'Organic', 'Premium'
];

// Màu sắc tiếng Việt
const tenMauSac = [
  'Đỏ', 'Xanh Dương', 'Xanh Lá', 'Vàng', 'Cam', 'Tím', 'Hồng', 'Nâu',
  'Xám', 'Đen', 'Trắng', 'Be', 'Navy', 'Olive', 'Burgundy', 'Kem',
  'Xanh Ngọc', 'Xanh Mint', 'Hồng Nhạt', 'Xanh Pastel', 'Tím Than',
  'Nâu Đất', 'Xám Khói', 'Trắng Ngà', 'Đỏ Đô', 'Xanh Cổ Vịt',
  'Vàng Đồng', 'Bạc', 'Vàng Kim', 'Hồng Sen', 'Xanh Biển',
  'Xanh Rêu', 'Nâu Chocolate', 'Cam Đất', 'Tím Lavender', 'Xanh Cobalt',
  'Đỏ Rượu', 'Xám Đậm', 'Trắng Tinh', 'Đen Tuyền', 'Be Sáng'
];

// Độ bóng
const doBong = [
  'Mờ hoàn toàn', 'Mờ nhẹ', 'Bán mờ', 'Bóng nhẹ', 'Bóng vừa',
  'Bóng cao', 'Siêu bóng', 'Satin', 'Ánh kim', 'Lì',
  'Nhũ nhẹ', 'Lấp lánh', 'Matte', 'Semi-gloss', 'High-gloss'
];

// Tên kho
const tenKho = [
  'Kho Trung Tâm', 'Kho Miền Bắc', 'Kho Miền Nam', 'Kho Miền Trung', 'Kho Dự Phòng',
  'Kho Bình Dương', 'Kho Long An', 'Kho Đồng Nai', 'Kho Hà Nội', 'Kho Hải Phòng',
  'Kho Đà Nẵng', 'Kho Cần Thơ', 'Kho Vũng Tàu', 'Kho Nha Trang', 'Kho Huế',
  'Kho Quảng Ninh', 'Kho Thanh Hóa', 'Kho Nghệ An', 'Kho Bình Định', 'Kho Gia Lai'
];

// Khu vực kho
const khuVucKho = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// Tên cửa hàng
const tenCuaHang = [
  'Cửa hàng Vải Sài Gòn', 'Cửa hàng Vải Hà Nội', 'Cửa hàng Vải Đà Nẵng',
  'Cửa hàng Vải Cần Thơ', 'Cửa hàng Vải Hải Phòng', 'Cửa hàng Vải Nha Trang',
  'Cửa hàng Vải Huế', 'Cửa hàng Vải Vũng Tàu', 'Cửa hàng Vải Biên Hòa',
  'Cửa hàng Vải Đà Lạt', 'Cửa hàng Vải Quy Nhơn', 'Cửa hàng Vải Phan Thiết',
  'Cửa hàng Vải Buôn Ma Thuột', 'Cửa hàng Vải Thái Nguyên', 'Cửa hàng Vải Nam Định'
];

// Loại cửa hàng
const loaiCuaHang = ['Chi nhánh', 'Đại lý', 'Showroom', 'Outlet'];

// Mô tả sản phẩm vải
const moTaVai = [
  'Chất liệu cao cấp, phù hợp may áo sơ mi, váy đầm',
  'Vải mềm mịn, thoáng mát, thích hợp cho mùa hè',
  'Độ bền cao, màu sắc tươi sáng, không phai màu',
  'Vải co giãn tốt, thoải mái khi vận động',
  'Chất liệu tự nhiên, thân thiện với môi trường',
  'Phù hợp may đồ công sở, lịch sự và sang trọng',
  'Vải dày dặn, giữ ấm tốt cho mùa đông',
  'Họa tiết độc đáo, phong cách thời trang',
  'Dễ giặt ủi, không nhăn, tiết kiệm thời gian',
  'Vải nhẹ nhàng, thoáng khí, chống tia UV'
];

// Ghi chú đơn hàng
const ghiChuDonHang = [
  'Giao hàng trong giờ hành chính',
  'Gọi điện trước khi giao',
  'Giao hàng sau 17h',
  'Kiểm tra hàng trước khi nhận',
  'Đóng gói cẩn thận',
  'Giao hàng gấp',
  'Liên hệ trước 1 tiếng',
  'Giao tại cổng bảo vệ',
  'Yêu cầu hóa đơn VAT',
  'Khách hàng VIP - ưu tiên giao'
];

// Ghi chú xuất kho
const ghiChuXuatKho = [
  'Xuất hàng theo yêu cầu cửa hàng',
  'Bổ sung hàng thiếu',
  'Chuyển kho nội bộ',
  'Xuất hàng khuyến mãi',
  'Xuất hàng trưng bày',
  'Xuất hàng theo đơn đặt',
  'Xuất hàng mẫu',
  'Xuất hàng đổi trả',
  'Xuất hàng theo hợp đồng',
  'Xuất hàng thanh lý'
];

// =============================================
// HELPER FUNCTIONS
// =============================================

// Hàm tạo tên người Việt
function taoTenNguoiViet() {
  const ho = faker.helpers.arrayElement(hoViet);
  const dem = faker.helpers.arrayElement(tenDem);
  const ten = faker.helpers.arrayElement(tenViet);
  return `${ho} ${dem} ${ten}`;
}

// Hàm tạo username từ tên tiếng Việt
function taoUsername(fullname) {
  const removeVietnamese = (str) => {
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/\s+/g, '');
  };
  return removeVietnamese(fullname) + faker.number.int({ min: 1, max: 999 });
}

// Hàm tạo địa chỉ Việt Nam
function taoDiaChiVietNam() {
  const soNha = faker.number.int({ min: 1, max: 500 });
  const duong = faker.helpers.arrayElement(tenDuong);
  const quan = faker.helpers.arrayElement(tenQuan);
  const thanhPho = faker.helpers.arrayElement(tenThanhPho);
  return `${soNha} ${duong}, ${quan}, ${thanhPho}`;
}

// Hàm tạo tên công ty nhà cung cấp
function taoTenNhaCungCap() {
  const ten = faker.helpers.arrayElement(tenCongTyVai);
  const loai = faker.helpers.arrayElement(loaiCongTy);
  return `Công ty ${loai} ${ten}`;
}

// Hàm tạo tên loại vải có đặc điểm
function taoTenLoaiVai(index) {
  if (index < tenLoaiVai.length) {
    return tenLoaiVai[index];
  }
  const loai = faker.helpers.arrayElement(tenLoaiVai);
  const dacDiem = faker.helpers.arrayElement(dacDiemVai);
  return `${loai} ${dacDiem}`;
}

// Hàm tạo tên màu sắc
function taoTenMauSac(index) {
  if (index < tenMauSac.length) {
    return tenMauSac[index];
  }
  const mau = faker.helpers.arrayElement(tenMauSac);
  const shade = faker.helpers.arrayElement(['Nhạt', 'Đậm', 'Pastel', 'Neon', 'Vintage']);
  return `${mau} ${shade}`;
}

// Hàm tạo tên kho
function taoTenKho(index) {
  if (index < tenKho.length) {
    return tenKho[index];
  }
  const ten = faker.helpers.arrayElement(tenKho.slice(0, 5));
  const khuVuc = faker.helpers.arrayElement(khuVucKho);
  return `${ten} - Khu ${khuVuc}${faker.number.int({ min: 1, max: 9 })}`;
}

// Hàm tạo tên cửa hàng
function taoTenCuaHang(index) {
  if (index < tenCuaHang.length) {
    return tenCuaHang[index];
  }
  const ten = faker.helpers.arrayElement(tenCuaHang.slice(0, 5));
  const loai = faker.helpers.arrayElement(loaiCuaHang);
  const soThuTu = index - tenCuaHang.length + 1;
  return `${ten} - ${loai} ${soThuTu}`;
}

// Hàm tạo mô tả vải
function taoMoTaVai() {
  return faker.helpers.arrayElement(moTaVai);
}

// Hàm tạo ghi chú đơn hàng
function taoGhiChuDonHang() {
  return faker.helpers.arrayElement(ghiChuDonHang);
}

// Hàm tạo ghi chú xuất kho
function taoGhiChuXuatKho() {
  return faker.helpers.arrayElement(ghiChuXuatKho);
}

// =============================================
// BATCH PROCESSING HELPER
// =============================================

// Hàm xử lý batch updates để tránh cạn kiệt connection pool
async function batchUpdate(updates, batchSize = 50, description = '') {
  let completed = 0;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(batch);
    completed += batch.length;
    if (description) {
      process.stdout.write(`\r  Processing ${description}: ${completed}/${updates.length}`);
    }
  }
  if (description) {
    console.log(); // New line after progress
  }
}

// Cấu hình số lượng bản ghi cho mỗi bảng từ environment variables
// Sử dụng giá trị mặc định nếu không có trong .env
const CONFIG = {
  USERS: parseInt(process.env.MOCK_USERS) || 200,
  FABRIC_CATEGORIES: parseInt(process.env.MOCK_FABRIC_CATEGORIES) || 100,
  FABRIC_COLORS: parseInt(process.env.MOCK_FABRIC_COLORS) || 150,
  FABRIC_GLOSS: parseInt(process.env.MOCK_FABRIC_GLOSS) || 80,
  SUPPLIERS: parseInt(process.env.MOCK_SUPPLIERS) || 120,
  WAREHOUSES: parseInt(process.env.MOCK_WAREHOUSES) || 50,
  STORES: parseInt(process.env.MOCK_STORES) || 80,
  FABRICS: parseInt(process.env.MOCK_FABRICS) || 500,
  SHELVES_PER_WAREHOUSE: parseInt(process.env.MOCK_SHELVES_PER_WAREHOUSE) || 100,
  IMPORT_FABRICS: parseInt(process.env.MOCK_IMPORT_FABRICS) || 150,
  IMPORT_ITEMS_PER_IMPORT: parseInt(process.env.MOCK_IMPORT_ITEMS_PER_IMPORT) || 5,
  EXPORT_FABRICS: parseInt(process.env.MOCK_EXPORT_FABRICS) || 120,
  EXPORT_ITEMS_PER_EXPORT: parseInt(process.env.MOCK_EXPORT_ITEMS_PER_EXPORT) || 40,
  FABRIC_SHELVES: parseInt(process.env.MOCK_FABRIC_SHELVES) || 400,
  FABRIC_STORES: parseInt(process.env.MOCK_FABRIC_STORES) || 350,
  ORDERS: parseInt(process.env.MOCK_ORDERS) || 200,
  ORDER_ITEMS_PER_ORDER: parseInt(process.env.MOCK_ORDER_ITEMS_PER_ORDER) || 3,
  INVOICE_PERCENTAGE: parseFloat(process.env.MOCK_INVOICE_PERCENTAGE) || 0.9,
  PAYMENT_PERCENTAGE: parseFloat(process.env.MOCK_PAYMENT_PERCENTAGE) || 0.8,
};

async function main() {
  console.log('🚀 Starting optimized mock data generation...\n');
  
  // Hiển thị cấu hình
  console.log('⚙️  Configuration:');
  console.log(`   - Users: ${CONFIG.USERS}`);
  console.log(`   - Fabric Categories: ${CONFIG.FABRIC_CATEGORIES}`);
  console.log(`   - Fabric Colors: ${CONFIG.FABRIC_COLORS}`);
  console.log(`   - Warehouses: ${CONFIG.WAREHOUSES}`);
  console.log(`   - Stores: ${CONFIG.STORES}`);
  console.log(`   - Fabrics: ${CONFIG.FABRICS}`);
  console.log(`   - Shelves per Warehouse: ${CONFIG.SHELVES_PER_WAREHOUSE}`);
  console.log(`   - Orders: ${CONFIG.ORDERS}`);
  console.log(`   - Order Items per Order: ${CONFIG.ORDER_ITEMS_PER_ORDER}\n`);

  // Lấy roles có sẵn từ seed
  const roles = await prisma.role.findMany();
  console.log(`✅ Found ${roles.length} existing roles`);

  // 1. TẠO USERS
  console.log('\n📝 Preparing users data...');
  const existingUsers = await prisma.user.findMany({ select: { username: true, email: true, phone: true } });
  const existingUsernames = new Set(existingUsers.map(u => u.username));
  const existingEmails = new Set(existingUsers.map(u => u.email));
  const existingPhones = new Set(existingUsers.map(u => u.phone));
  const hashedPassword = await bcrypt.hash('password123', 10);
  const userRoles = roles.map(r => r.name);
  
  const usersToCreate = [];
  for (let i = 0; i < CONFIG.USERS; i++) {
    const fullname = taoTenNguoiViet();
    const username = taoUsername(fullname);
    const email = `${username}@gmail.com`;
    const phone = `09${String(10000000 + i).padStart(8, '0')}`;
    
    if (!existingUsernames.has(username) && !existingEmails.has(email) && !existingPhones.has(phone)) {
      usersToCreate.push({
        username,
        password: hashedPassword,
        email,
        phone,
        fullname,
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        address: taoDiaChiVietNam(),
        dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
        emailVerified: faker.datatype.boolean(0.8),
        emailVerifiedAt: faker.datatype.boolean(0.8) ? new Date() : null,
        role: faker.helpers.arrayElement(userRoles),
      });
      existingUsernames.add(username);
      existingEmails.add(email);
      existingPhones.add(phone);
    }
  }
  
  const usersResult = await prisma.user.createMany({ data: usersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${usersResult.count} users`);
  const allUsers = await prisma.user.findMany();

  // 2. TẠO FABRIC CATEGORIES
  console.log('\n📝 Preparing fabric categories...');
  const existingCategories = await prisma.fabricCategory.findMany({ select: { name: true } });
  const existingCategoryNames = new Set(existingCategories.map(c => c.name));
  
  const categoriesToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_CATEGORIES; i++) {
    const name = taoTenLoaiVai(i);
    
    if (!existingCategoryNames.has(name)) {
      categoriesToCreate.push({
        name,
        sellingPricePerMeter: faker.number.float({ min: 50000, max: 300000, multipleOf: 1000 }),
        sellingPricePerRoll: faker.number.float({ min: 500000, max: 3000000, multipleOf: 10000 }),
        description: taoMoTaVai(),
      });
      existingCategoryNames.add(name);
    }
  }
  
  const categoriesResult = await prisma.fabricCategory.createMany({ data: categoriesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${categoriesResult.count} fabric categories`);
  const allCategories = await prisma.fabricCategory.findMany();

  // 3. TẠO FABRIC COLORS
  console.log('\n📝 Preparing fabric colors...');
  const existingColors = await prisma.fabricColor.findMany({ select: { id: true, name: true } });
  const existingColorNames = new Set(existingColors.map(c => c.name));
  
  // Danh sách màu cơ bản với hex codes
  const basicColors = [
    { name: 'Đỏ', hex: '#FF0000' },
    { name: 'Xanh da trời', hex: '#0099FF' },
    { name: 'Xanh lục', hex: '#00AA00' },
    { name: 'Vàng', hex: '#FFFF00' },
    { name: 'Cam', hex: '#FF9900' },
    { name: 'Tím', hex: '#9933FF' },
    { name: 'Hồng', hex: '#FF66BB' },
    { name: 'Nâu', hex: '#996633' },
    { name: 'Xám', hex: '#CCCCCC' },
    { name: 'Đen', hex: '#000000' }
  ];
  
  const colorsToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_COLORS; i++) {
    const colorId = `MAU${String(i + 1).padStart(3, '0')}`;
    const colorInfo = basicColors[i % basicColors.length];
    const name = i < basicColors.length ? colorInfo.name : taoTenMauSac(i);
    const hexCode = i < basicColors.length ? colorInfo.hex : null;
    
    if (!existingColorNames.has(name)) {
      colorsToCreate.push({ id: colorId, name, hexCode });
      existingColorNames.add(name);
    }
  }
  
  const colorsResult = await prisma.fabricColor.createMany({ data: colorsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${colorsResult.count} fabric colors`);
  const allColors = await prisma.fabricColor.findMany();

  // 4. TẠO FABRIC GLOSS
  console.log('\n📝 Preparing fabric gloss levels...');
  const existingGlosses = await prisma.fabricGloss.findMany({ select: { description: true } });
  const existingGlossDescs = new Set(existingGlosses.map(g => g.description));
  
  const glossesToCreate = [];
  for (let i = 0; i < CONFIG.FABRIC_GLOSS; i++) {
    const description = i < doBong.length 
      ? doBong[i] 
      : `${faker.helpers.arrayElement(doBong)} ${faker.number.int({ min: 1, max: 5 })}`;
    
    if (!existingGlossDescs.has(description)) {
      glossesToCreate.push({ description });
      existingGlossDescs.add(description);
    }
  }
  
  const glossesResult = await prisma.fabricGloss.createMany({ data: glossesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${glossesResult.count} fabric gloss levels`);
  const allGlosses = await prisma.fabricGloss.findMany();

  // 5. TẠO SUPPLIERS
  console.log('\n📝 Preparing suppliers...');
  const existingSuppliers = await prisma.supplier.findMany({ select: { phone: true } });
  const existingSupplierPhones = new Set(existingSuppliers.map(s => s.phone));
  
  const suppliersToCreate = [];
  for (let i = 0; i < CONFIG.SUPPLIERS; i++) {
    const phone = `08${String(10000000 + i).padStart(8, '0')}`;
    
    if (!existingSupplierPhones.has(phone)) {
      suppliersToCreate.push({
        name: taoTenNhaCungCap(),
        address: taoDiaChiVietNam(),
        phone,
        isActive: faker.datatype.boolean(0.9),
      });
      existingSupplierPhones.add(phone);
    }
  }
  
  const suppliersResult = await prisma.supplier.createMany({ data: suppliersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${suppliersResult.count} suppliers`);
  const allSuppliers = await prisma.supplier.findMany();

  // 6. TẠO WAREHOUSES
  console.log('\n📝 Preparing warehouses...');
  const existingWarehouses = await prisma.warehouse.findMany({ select: { name: true } });
  const existingWarehouseNames = new Set(existingWarehouses.map(w => w.name));
  
  const warehousesToCreate = [];
  for (let i = 0; i < CONFIG.WAREHOUSES; i++) {
    const name = taoTenKho(i);
    
    if (!existingWarehouseNames.has(name)) {
      warehousesToCreate.push({
        name,
        address: taoDiaChiVietNam(),
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
      });
      existingWarehouseNames.add(name);
    }
  }
  
  const warehousesResult = await prisma.warehouse.createMany({ data: warehousesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${warehousesResult.count} warehouses`);
  const allWarehouses = await prisma.warehouse.findMany();

  // 7. TẠO STORES
  console.log('\n📝 Preparing stores...');
  
  const storesToCreate = [];
  for (let i = 0; i < CONFIG.STORES; i++) {
    const name = taoTenCuaHang(i);
    
    storesToCreate.push({
      name,
      address: taoDiaChiVietNam(),
      isActive: faker.datatype.boolean(0.9),
    });
  }
  
  const storesResult = await prisma.store.createMany({ data: storesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${storesResult.count} stores`);
  const allStores = await prisma.store.findMany();

  // 8. TẠO SHELVES
  console.log('\n📝 Preparing shelves...');
  const existingShelves = await prisma.shelf.findMany({ select: { code: true } });
  const existingShelfCodes = new Set(existingShelves.map(s => s.code));
  
  const shelvesToCreate = [];
  for (const warehouse of allWarehouses) {
    // Lấy chữ cái đầu của tên kho (bỏ dấu)
    const warehouseCode = warehouse.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .substring(0, 3)
      .toUpperCase();
    
    for (let i = 0; i < CONFIG.SHELVES_PER_WAREHOUSE; i++) {
      const khuVuc = faker.helpers.arrayElement(khuVucKho);
      const code = `${warehouseCode}-${khuVuc}${String(i + 1).padStart(3, '0')}`;
      
      if (!existingShelfCodes.has(code)) {
        shelvesToCreate.push({
          code,
          currentQuantity: 0, // Ban đầu kệ trống
          maxQuantity: faker.number.int({ min: 40, max: 100 }),
          warehouseId: warehouse.id,
        });
        existingShelfCodes.add(code);
      }
    }
  }
  
  const shelvesResult = await prisma.shelf.createMany({ data: shelvesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${shelvesResult.count} shelves`);
  const allShelves = await prisma.shelf.findMany();

  // 9. TẠO FABRICS (quantityInStock = 0, sẽ được cập nhật sau khi nhập kho)
  console.log('\n📝 Preparing fabrics...');
  const fabricsToCreate = [];
  
  for (let i = 0; i < CONFIG.FABRICS; i++) {
    fabricsToCreate.push({
      thickness: faker.number.float({ min: 0.1, max: 5.0, multipleOf: 0.1 }),
      glossId: faker.helpers.arrayElement(allGlosses).id,
      length: faker.number.float({ min: 10, max: 100, multipleOf: 0.5 }),
      width: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      weight: faker.number.float({ min: 0.5, max: 10, multipleOf: 0.1 }),
      sellingPrice: faker.number.float({ min: 50000, max: 500000, multipleOf: 1000 }),
      quantityInStock: 0, // Ban đầu chưa có hàng, sẽ tăng khi nhập kho
      categoryId: faker.helpers.arrayElement(allCategories).id,
      colorId: faker.helpers.arrayElement(allColors).id,
      supplierId: faker.helpers.arrayElement(allSuppliers).id,
    });
  }
  
  const fabricsResult = await prisma.fabric.createMany({ data: fabricsToCreate });
  console.log(`✅ Created ${fabricsResult.count} fabrics`);
  const allFabrics = await prisma.fabric.findMany();

  // 10. TẠO IMPORT FABRICS (Đơn nhập kho)
  console.log('\n📝 Preparing import fabric records...');
  
  // Tạo map để theo dõi kệ nào thuộc kho nào
  const shelfsByWarehouse = new Map();
  for (const shelf of allShelves) {
    if (!shelfsByWarehouse.has(shelf.warehouseId)) {
      shelfsByWarehouse.set(shelf.warehouseId, []);
    }
    shelfsByWarehouse.get(shelf.warehouseId).push(shelf);
  }
  
  // Tạo các đơn nhập kho với status PENDING
  const importFabricsToCreate = [];
  for (let i = 0; i < CONFIG.IMPORT_FABRICS; i++) {
    const warehouse = faker.helpers.arrayElement(allWarehouses);
    importFabricsToCreate.push({
      warehouseId: warehouse.id,
      importer: faker.helpers.arrayElement(allUsers).id,
      importDate: faker.date.recent({ days: 90 }),
      totalPrice: 0, // Sẽ được tính sau
      status: 'PENDING',
    });
  }
  
  const importFabricsResult = await prisma.importFabric.createMany({ data: importFabricsToCreate });
  console.log(`✅ Created ${importFabricsResult.count} import fabric records (PENDING)`);
  const allImportFabrics = await prisma.importFabric.findMany({ include: { warehouse: true } });

  // 11. TẠO IMPORT FABRIC ITEMS (Các mặt hàng trong đơn nhập)
  console.log('\n📝 Preparing import fabric items...');
  const importItemsToCreate = [];
  const importItemKeys = new Set();
  const importTotalPrices = new Map(); // Theo dõi tổng giá cho mỗi đơn nhập
  
  for (const importFabric of allImportFabrics) {
    const itemsCount = Math.min(CONFIG.IMPORT_ITEMS_PER_IMPORT, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    let totalPrice = 0;
    
    for (const fabric of selectedFabrics) {
      const key = `${importFabric.id}-${fabric.id}`;
      if (!importItemKeys.has(key)) {
        const quantity = faker.number.int({ min: 1, max: 100 });
        const price = faker.number.float({ min: 30000, max: 400000, multipleOf: 1000 });
        totalPrice += quantity * price;
        
        importItemsToCreate.push({
          importFabricId: importFabric.id,
          fabricId: fabric.id,
          quantity,
          price,
          status: 'PENDING', // Ban đầu là PENDING
        });
        importItemKeys.add(key);
      }
    }
    importTotalPrices.set(importFabric.id, totalPrice);
  }
  
  const importItemsResult = await prisma.importFabricItem.createMany({ data: importItemsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${importItemsResult.count} import fabric items (PENDING)`);
  
  // Cập nhật totalPrice cho các đơn nhập
  console.log('\n📝 Updating import total prices...');
  const importPriceUpdates = [];
  for (const [importId, totalPrice] of importTotalPrices.entries()) {
    importPriceUpdates.push(
      prisma.importFabric.update({
        where: { id: importId },
        data: { totalPrice },
      })
    );
  }
  await Promise.all(importPriceUpdates);
  console.log(`✅ Updated ${importPriceUpdates.length} import total prices`);

  // 12. XẾP VẢI VÀO KỆ (Tạo FabricShelf với importId)
  // Logic: Xếp vải vào kệ sao cho không vượt quá maxQuantity của kệ
  // Tạo nhiều trường hợp cùng vải + cùng kệ nhưng khác importId
  // Nếu không đủ chỗ, tăng maxQuantity của kệ để chứa hết
  console.log('\n📝 Placing fabrics on shelves (processing imports)...');
  
  // Lấy lại import items để xử lý
  const allImportItems = await prisma.importFabricItem.findMany({
    include: { importFabric: true },
  });
  
  // Lấy thông tin maxQuantity của các kệ
  const shelvesWithCapacity = await prisma.shelf.findMany({
    select: { id: true, maxQuantity: true, currentQuantity: true, warehouseId: true, code: true }
  });
  
  // Map để theo dõi capacity còn lại của mỗi kệ và maxQuantity hiện tại
  const shelfRemainingCapacity = new Map();
  const shelfMaxQuantity = new Map();
  const shelfInfo = new Map();
  for (const shelf of shelvesWithCapacity) {
    shelfRemainingCapacity.set(shelf.id, shelf.maxQuantity - shelf.currentQuantity);
    shelfMaxQuantity.set(shelf.id, shelf.maxQuantity);
    shelfInfo.set(shelf.id, shelf);
  }
  
  // Theo dõi số lượng để cập nhật
  const shelfQuantityUpdates = new Map(); // shelfId -> tổng quantity cần thêm
  const shelfMaxQuantityUpdates = new Map(); // shelfId -> maxQuantity mới (nếu cần tăng)
  const fabricQuantityUpdates = new Map(); // fabricId -> tổng quantity cần thêm
  const fabricShelvesToCreate = [];
  const fabricShelfKeys = new Set();
  const itemsToMarkStored = []; // Các import items cần đánh dấu STORED
  const importsToComplete = new Set(); // Các đơn nhập cần đánh dấu COMPLETED
  
  // Để tạo nhiều trường hợp cùng vải + cùng kệ nhưng khác importId,
  // ta sẽ ưu tiên chọn lại các kệ đã có vải đó từ các đơn nhập trước
  const fabricToShelvesMap = new Map(); // fabricId -> [shelfId, ...]
  
  for (const importItem of allImportItems) {
    const warehouseId = importItem.importFabric.warehouseId;
    const warehouseShelves = shelfsByWarehouse.get(warehouseId) || [];
    
    if (warehouseShelves.length === 0) continue;
    
    let remainingQty = importItem.quantity;
    let allocatedShelves = [];
    let allocations = []; // Lưu tạm các allocation trước khi commit
    
    // Ưu tiên chọn kệ đã có loại vải này (tạo case cùng vải + cùng kệ + khác importId)
    const existingShelvesForFabric = fabricToShelvesMap.get(importItem.fabricId) || [];
    const candidateShelves = [
      ...existingShelvesForFabric.filter(sId => 
        warehouseShelves.some(ws => ws.id === sId)
      ),
      ...warehouseShelves.filter(s => 
        !existingShelvesForFabric.includes(s.id)
      ).map(s => s.id)
    ];
    
    // Phân bổ vải vào các kệ có capacity còn lại
    for (const shelfId of candidateShelves) {
      if (remainingQty <= 0) break;
      
      const capacity = shelfRemainingCapacity.get(shelfId) || 0;
      if (capacity <= 0) continue;
      
      const qtyToAllocate = Math.min(remainingQty, capacity);
      const key = `${shelfId}-${importItem.fabricId}-${importItem.importFabricId}`;
      
      if (!fabricShelfKeys.has(key)) {
        allocations.push({
          shelfId,
          fabricId: importItem.fabricId,
          importId: importItem.importFabricId,
          quantity: qtyToAllocate,
          key
        });
        
        // Tạm giảm capacity
        shelfRemainingCapacity.set(shelfId, capacity - qtyToAllocate);
        allocatedShelves.push(shelfId);
        remainingQty -= qtyToAllocate;
      }
    }
    
    // Nếu vẫn còn số lượng chưa phân bổ được, tăng maxQuantity của một kệ
    if (remainingQty > 0) {
      // Chọn ngẫu nhiên một kệ trong kho để tăng maxQuantity
      const availableShelves = candidateShelves.length > 0 
        ? candidateShelves.filter(sId => warehouseShelves.some(ws => ws.id === sId))
        : warehouseShelves.map(s => s.id);
      
      const targetShelfId = faker.helpers.arrayElement(availableShelves || [warehouseShelves[0]?.id]);
      
      if (targetShelfId) {
        const currentMax = shelfMaxQuantity.get(targetShelfId);
        const newMax = currentMax + remainingQty;
        const shelf = shelfInfo.get(targetShelfId);
        
        console.log(`📦 Expanding shelf ${shelf?.code} maxQuantity: ${currentMax} -> ${newMax} to fit fabric ${importItem.fabricId}`);
        
        // Cập nhật maxQuantity và capacity
        shelfMaxQuantity.set(targetShelfId, newMax);
        const currentRemaining = shelfRemainingCapacity.get(targetShelfId) || 0;
        shelfRemainingCapacity.set(targetShelfId, currentRemaining + remainingQty);
        shelfMaxQuantityUpdates.set(targetShelfId, newMax);
        
        const key = `${targetShelfId}-${importItem.fabricId}-${importItem.importFabricId}`;
        
        // Kiểm tra xem đã có allocation cho kệ này chưa
        const existingAllocation = allocations.find(a => a.shelfId === targetShelfId);
        if (existingAllocation) {
          // Cộng thêm số lượng vào allocation đã có
          existingAllocation.quantity += remainingQty;
        } else if (!fabricShelfKeys.has(key)) {
          allocations.push({
            shelfId: targetShelfId,
            fabricId: importItem.fabricId,
            importId: importItem.importFabricId,
            quantity: remainingQty,
            key
          });
          allocatedShelves.push(targetShelfId);
        }
        
        // Trừ capacity đã sử dụng
        shelfRemainingCapacity.set(targetShelfId, 0);
        remainingQty = 0;
      }
    }
    
    // Chỉ commit allocations nếu đã phân bổ được 100% số lượng
    if (remainingQty === 0 && allocations.length > 0) {
      for (const alloc of allocations) {
        fabricShelvesToCreate.push({
          shelfId: alloc.shelfId,
          fabricId: alloc.fabricId,
          importId: alloc.importId,
          quantity: alloc.quantity,
        });
        fabricShelfKeys.add(alloc.key);
        
        // Cập nhật tổng số lượng cho kệ
        const currentShelfQty = shelfQuantityUpdates.get(alloc.shelfId) || 0;
        shelfQuantityUpdates.set(alloc.shelfId, currentShelfQty + alloc.quantity);
        
        // Cập nhật tổng số lượng cho vải
        const currentFabricQty = fabricQuantityUpdates.get(alloc.fabricId) || 0;
        fabricQuantityUpdates.set(alloc.fabricId, currentFabricQty + alloc.quantity);
      }
      
      // Lưu lại các kệ đã có vải này
      const existing = fabricToShelvesMap.get(importItem.fabricId) || [];
      fabricToShelvesMap.set(importItem.fabricId, [...new Set([...existing, ...allocatedShelves])]);
      
      // Đánh dấu item này cần update status
      itemsToMarkStored.push({
        importFabricId: importItem.importFabricId,
        fabricId: importItem.fabricId,
      });
      
      // Đánh dấu đơn nhập này sẽ được hoàn thành
      importsToComplete.add(importItem.importFabricId);
    } else if (remainingQty > 0) {
      console.log(`⚠️  Warning: Could not fully allocate fabric ${importItem.fabricId} from import ${importItem.importFabricId}. Remaining: ${remainingQty}`);
    }
  }
  
  // Cập nhật maxQuantity cho các kệ cần mở rộng
  if (shelfMaxQuantityUpdates.size > 0) {
    console.log('\n📝 Expanding shelf capacities...');
    const maxQtyUpdates = [];
    for (const [shelfId, newMaxQty] of shelfMaxQuantityUpdates.entries()) {
      maxQtyUpdates.push(
        prisma.shelf.update({
          where: { id: shelfId },
          data: { maxQuantity: newMaxQty },
        })
      );
    }
    await batchUpdate(maxQtyUpdates, 50, 'expanding shelves');
    console.log(`✅ Expanded ${maxQtyUpdates.length} shelf capacities`);
  }
  
  // Tạo FabricShelf records
  const fabricShelvesResult = await prisma.fabricShelf.createMany({ 
    data: fabricShelvesToCreate, 
    skipDuplicates: true 
  });
  console.log(`✅ Created ${fabricShelvesResult.count} fabric-shelf relationships`);
  
  // Cập nhật currentQuantity cho các kệ
  console.log('\n📝 Updating shelf quantities...');
  const shelfUpdates = [];
  for (const [shelfId, addQuantity] of shelfQuantityUpdates.entries()) {
    shelfUpdates.push(
      prisma.shelf.update({
        where: { id: shelfId },
        data: { currentQuantity: { increment: addQuantity } },
      })
    );
  }
  await batchUpdate(shelfUpdates, 50, 'updating shelf quantities');
  console.log(`✅ Updated ${shelfUpdates.length} shelf quantities`);
  
  // Cập nhật quantityInStock cho các vải
  console.log('\n📝 Updating fabric stock quantities...');
  const fabricUpdates = [];
  for (const [fabricId, addQuantity] of fabricQuantityUpdates.entries()) {
    fabricUpdates.push(
      prisma.fabric.update({
        where: { id: fabricId },
        data: { quantityInStock: { increment: addQuantity } },
      })
    );
  }
  await batchUpdate(fabricUpdates, 50, 'updating fabric quantities');
  console.log(`✅ Updated ${fabricUpdates.length} fabric stock quantities`);
  
  // Cập nhật status của ImportFabricItem thành STORED
  console.log('\n📝 Marking import items as STORED...');
  const itemStatusUpdates = [];
  for (const item of itemsToMarkStored) {
    itemStatusUpdates.push(
      prisma.importFabricItem.update({
        where: {
          importFabricId_fabricId: {
            importFabricId: item.importFabricId,
            fabricId: item.fabricId,
          },
        },
        data: { status: 'STORED' },
      })
    );
  }
  await batchUpdate(itemStatusUpdates, 50, 'marking items as STORED');
  console.log(`✅ Marked ${itemStatusUpdates.length} import items as STORED`);
  
  // Cập nhật status của ImportFabric thành COMPLETED
  console.log('\n📝 Marking imports as COMPLETED...');
  const importStatusUpdates = [];
  for (const importId of importsToComplete) {
    importStatusUpdates.push(
      prisma.importFabric.update({
        where: { id: importId },
        data: { status: 'COMPLETED' },
      })
    );
  }
  await batchUpdate(importStatusUpdates, 50, 'marking imports as COMPLETED');
  console.log(`✅ Marked ${importStatusUpdates.length} imports as COMPLETED`);

  // 13. TẠO FABRIC STORES
  console.log('\n📝 Preparing fabric-store relationships...');
  const fabricStoresToCreate = [];
  const fabricStoreKeys = new Set();
  
  for (let i = 0; i < CONFIG.FABRIC_STORES; i++) {
    const fabric = faker.helpers.arrayElement(allFabrics);
    const storeId = faker.helpers.arrayElement(allStores).id;
    const key = `${fabric.id}-${storeId}`;
    
    if (!fabricStoreKeys.has(key)) {
      // Tính toán các giá trị cho fabric store
      const uncutRolls = faker.number.int({ min: 2, max: 10 });
      const cuttingRollMeters = faker.number.float({ min: 0, max: fabric.length, fractionDigits: 2 });
      const quantity = uncutRolls + (cuttingRollMeters > 0 ? 1 : 0);
      
      // Tổng số mét = cuộn chưa cắt * độ dài cuộn + cuộn đang cắt dở
      const totalMeters = (uncutRolls * fabric.length) + cuttingRollMeters;
      
      // Giá nhập giả định (70-90% giá bán)
      const importPricePerMeter = fabric.sellingPrice ? fabric.sellingPrice * faker.number.float({ min: 0.7, max: 0.9, fractionDigits: 2 }) : 0;
      const totalValue = totalMeters * importPricePerMeter;
      
      fabricStoresToCreate.push({
        fabricId: fabric.id,
        storeId,
        quantity: quantity,
        totalValue: totalValue,
        totalMeters: totalMeters,
        uncutRolls: uncutRolls,
        cuttingRollMeters: cuttingRollMeters
      });
      fabricStoreKeys.add(key);
    }
  }
  
  const fabricStoresResult = await prisma.fabricStore.createMany({ data: fabricStoresToCreate, skipDuplicates: true });
  console.log(`✅ Created ${fabricStoresResult.count} fabric-store relationships`);

  // 14. TẠO WAREHOUSE MANAGES
  console.log('\n📝 Preparing warehouse managers...');
  const warehouseManagesToCreate = [];
  const warehouseManageKeys = new Set();
  
  for (const warehouse of allWarehouses) {
    const managersCount = faker.number.int({ min: 1, max: 3 });
    const selectedManagers = faker.helpers.arrayElements(allUsers, managersCount);
    const assigner = faker.helpers.arrayElement(allUsers);
    
    for (const manager of selectedManagers) {
      const key = `${manager.id}-${warehouse.id}`;
      if (!warehouseManageKeys.has(key)) {
        warehouseManagesToCreate.push({
          userId: manager.id,
          warehouseId: warehouse.id,
          assignedBy: assigner.id,
          assignedAt: faker.date.past({ years: 1 }),
        });
        warehouseManageKeys.add(key);
      }
    }
  }
  
  const warehouseManagesResult = await prisma.warehouseManage.createMany({ data: warehouseManagesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${warehouseManagesResult.count} warehouse manager assignments`);

  // 16. TẠO EXPORT FABRICS
  console.log('\n📝 Preparing export fabric records...');
  const exportFabricsToCreate = [];
  
  // Tạo phiếu xuất PENDING (chưa duyệt)
  for (let i = 0; i < Math.floor(CONFIG.EXPORT_FABRICS * 0.4); i++) {
    const exportData = {
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      storeId: faker.helpers.arrayElement(allStores).id,
      createdById: faker.helpers.arrayElement(allUsers).id,
      status: 'PENDING',
      note: faker.datatype.boolean(0.7) ? taoGhiChuXuatKho() : null,
    };
    exportFabricsToCreate.push(exportData);
  }

  // Tạo phiếu xuất APPROVED (đã duyệt)
  for (let i = 0; i < Math.floor(CONFIG.EXPORT_FABRICS * 0.4); i++) {
    const exportData = {
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      storeId: faker.helpers.arrayElement(allStores).id,
      createdById: faker.helpers.arrayElement(allUsers).id,
      status: 'APPROVED',
      receivedById: faker.helpers.arrayElement(allUsers).id,
      note: faker.datatype.boolean(0.7) ? taoGhiChuXuatKho() : null,
    };
    exportFabricsToCreate.push(exportData);
  }

  // Tạo phiếu xuất COMPLETED (hoàn thành)
  for (let i = 0; i < Math.floor(CONFIG.EXPORT_FABRICS * 0.15); i++) {
    const exportData = {
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      storeId: faker.helpers.arrayElement(allStores).id,
      createdById: faker.helpers.arrayElement(allUsers).id,
      status: 'COMPLETED',
      receivedById: faker.helpers.arrayElement(allUsers).id,
      note: faker.datatype.boolean(0.7) ? taoGhiChuXuatKho() : null,
    };
    exportFabricsToCreate.push(exportData);
  }

  // Tạo phiếu xuất REJECTED (từ chối)
  for (let i = 0; i < Math.floor(CONFIG.EXPORT_FABRICS * 0.05); i++) {
    const exportData = {
      warehouseId: faker.helpers.arrayElement(allWarehouses).id,
      storeId: faker.helpers.arrayElement(allStores).id,
      createdById: faker.helpers.arrayElement(allUsers).id,
      status: 'REJECTED',
      receivedById: faker.helpers.arrayElement(allUsers).id,
      note: faker.datatype.boolean(0.7) ? taoGhiChuXuatKho() : null,
    };
    exportFabricsToCreate.push(exportData);
  }
  
  const exportFabricsResult = await prisma.exportFabric.createMany({ data: exportFabricsToCreate });
  console.log(`✅ Created ${exportFabricsResult.count} export fabric records`);
  const allExportFabrics = await prisma.exportFabric.findMany();

  // 17. TẠO EXPORT FABRIC ITEMS
  console.log('\n📝 Preparing export fabric items...');
  const exportItemsToCreate = [];
  
  for (const exportFabric of allExportFabrics) {
    const itemsCount = Math.min(CONFIG.EXPORT_ITEMS_PER_EXPORT, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    
    if (exportFabric.status === 'PENDING') {
      // PENDING: Chỉ có fabricId và quantity, price = null (chưa duyệt)
      for (const fabric of selectedFabrics) {
        exportItemsToCreate.push({
          exportFabricId: exportFabric.id,
          fabricId: fabric.id,
          quantity: faker.number.int({ min: 5, max: 50 }),
          price: null, // Chưa duyệt nên chưa có giá
        });
      }
    } else if (exportFabric.status === 'APPROVED' || exportFabric.status === 'COMPLETED') {
      // APPROVED/COMPLETED: Tạo nhiều items cho cùng 1 fabric (giả lập nhiều batch với giá khác nhau)
      for (const fabric of selectedFabrics) {
        const totalQuantity = faker.number.int({ min: 20, max: 100 });
        const batchCount = faker.number.int({ min: 1, max: 3 }); // 1-3 batch cho mỗi fabric
        
        let remainingQty = totalQuantity;
        for (let i = 0; i < batchCount; i++) {
          const isLastBatch = i === batchCount - 1;
          const batchQty = isLastBatch ? remainingQty : faker.number.int({ min: 5, max: Math.floor(remainingQty / (batchCount - i)) });
          
          // Lấy giá từ ImportFabricItem ngẫu nhiên
          const randomImportItem = faker.helpers.arrayElement(
            allImportItems.filter(item => item.fabricId === fabric.id)
          );
          const importPrice = randomImportItem?.price || faker.number.float({ min: 40000, max: 500000, multipleOf: 1000 });
          
          exportItemsToCreate.push({
            exportFabricId: exportFabric.id,
            fabricId: fabric.id,
            quantity: batchQty,
            price: importPrice, // Giá nhập từ ImportFabricItem
          });
          
          remainingQty -= batchQty;
        }
      }
    } else if (exportFabric.status === 'REJECTED') {
      // REJECTED: Có thể có hoặc không có items (không quan trọng vì đã từ chối)
      for (const fabric of selectedFabrics) {
        exportItemsToCreate.push({
          exportFabricId: exportFabric.id,
          fabricId: fabric.id,
          quantity: faker.number.int({ min: 5, max: 50 }),
          price: null,
        });
      }
    }
  }
  
  const exportItemsResult = await prisma.exportFabricItem.createMany({ data: exportItemsToCreate });
  console.log(`✅ Created ${exportItemsResult.count} export fabric items`);

  // 18. TẠO ORDERS
  console.log('\n📝 Preparing orders...');
  const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED'];
  const ordersToCreate = [];
  
  for (let i = 0; i < CONFIG.ORDERS; i++) {
    const randomUser = faker.helpers.arrayElement(allUsers);
    const orderDate = faker.date.between({ from: '2024-01-01', to: new Date() });
    
    ordersToCreate.push({
      userId: randomUser.id,
      orderDate,
      status: faker.helpers.arrayElement(orderStatuses),
      totalAmount: 0, // Will be calculated based on order items
      notes: faker.helpers.maybe(() => taoGhiChuDonHang(), { probability: 0.3 }),
    });
  }
  
  const ordersResult = await prisma.order.createMany({ data: ordersToCreate, skipDuplicates: true });
  console.log(`✅ Created ${ordersResult.count} orders`);
  
  // Lấy tất cả orders vừa tạo
  const allOrders = await prisma.order.findMany({ orderBy: { id: 'asc' } });

  // 19. TẠO ORDER ITEMS
  console.log('\n📝 Preparing order items...');
  const orderItemsToCreate = [];
  const orderItemKeys = new Set();
  const orderTotals = new Map(); // Track total amount for each order
  
  for (const order of allOrders) {
    const itemsCount = Math.min(CONFIG.ORDER_ITEMS_PER_ORDER, allFabrics.length);
    const selectedFabrics = faker.helpers.arrayElements(allFabrics, itemsCount);
    let orderTotal = 0;
    
    for (const fabric of selectedFabrics) {
      const key = `${order.id}-${fabric.id}`;
      if (!orderItemKeys.has(key)) {
        const quantity = faker.number.int({ min: 1, max: 20 });
        const price = faker.number.float({ min: 50000, max: 1000000, multipleOf: 1000 });
        const saleUnit = faker.helpers.arrayElement(['ROLL', 'METER']);
        const itemTotal = quantity * price;
        
        orderItemsToCreate.push({
          orderId: order.id,
          fabricId: fabric.id,
          quantity,
          saleUnit,
          price,
        });
        orderItemKeys.add(key);
        orderTotal += itemTotal;
      }
    }
    
    orderTotals.set(order.id, orderTotal);
  }
  
  const orderItemsResult = await prisma.orderItem.createMany({ data: orderItemsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${orderItemsResult.count} order items`);

  // Update order total amounts
  console.log('\n📝 Updating order totals...');
  const orderUpdatePromises = [];
  for (const [orderId, totalAmount] of orderTotals.entries()) {
    orderUpdatePromises.push(
      prisma.order.update({
        where: { id: orderId },
        data: { totalAmount },
      })
    );
  }
  await batchUpdate(orderUpdatePromises, 50, 'updating order totals');
  console.log(`✅ Updated ${orderUpdatePromises.length} order totals`);

  // 20. TẠO INVOICES (90% của orders)
  console.log('\n📝 Preparing invoices...');
  const invoiceStatuses = ['UNPAID', 'PAID', 'OVERDUE', 'CREDIT', 'REFUNDED', 'CANCELED'];
  const invoicesToCreate = [];
  const ordersWithInvoices = faker.helpers.arrayElements(
    allOrders, 
    Math.floor(allOrders.length * CONFIG.INVOICE_PERCENTAGE)
  );
  
  // Ghi chú hóa đơn tiếng Việt
  const ghiChuHoaDon = [
    'Thanh toán trước khi giao hàng',
    'Khách hàng thanh toán qua chuyển khoản',
    'Đã nhận thanh toán tiền mặt',
    'Ghi nợ theo thỏa thuận',
    'Thanh toán khi nhận hàng',
    'Đã thanh toán qua ví điện tử',
    'Chiết khấu 5% cho khách VIP',
    'Giảm giá theo chương trình khuyến mãi',
    'Thanh toán theo đợt',
    'Hóa đơn VAT đã xuất'
  ];
  
  for (const order of ordersWithInvoices) {
    const invoiceDate = new Date(order.orderDate);
    
    invoicesToCreate.push({
      orderId: order.id,
      invoiceDate,
      invoiceStatus: faker.helpers.arrayElement(invoiceStatuses),
      totalAmount: order.totalAmount,
      notes: faker.helpers.maybe(() => faker.helpers.arrayElement(ghiChuHoaDon), { probability: 0.3 }),
    });
  }
  
  const invoicesResult = await prisma.invoice.createMany({ data: invoicesToCreate, skipDuplicates: true });
  console.log(`✅ Created ${invoicesResult.count} invoices`);
  
  // Lấy tất cả invoices vừa tạo
  const allInvoices = await prisma.invoice.findMany({ orderBy: { id: 'asc' } });

  // 21. TẠO PAYMENTS (80% của invoices)
  console.log('\n📝 Preparing payments...');
  const paymentMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'E_WALLET'];
  const paymentsToCreate = [];
  const invoicesWithPayments = faker.helpers.arrayElements(
    allInvoices, 
    Math.floor(allInvoices.length * CONFIG.PAYMENT_PERCENTAGE)
  );
  
  // Ghi chú thanh toán tiếng Việt
  const ghiChuThanhToan = [
    'Thanh toán đầy đủ',
    'Thanh toán trước 50%',
    'Thanh toán đợt cuối',
    'Khách hàng chuyển khoản',
    'Thu tiền mặt tại quầy',
    'Thanh toán qua Momo',
    'Thanh toán qua ZaloPay',
    'Thanh toán qua VNPay',
    'Thanh toán qua thẻ Visa',
    'Thanh toán qua thẻ MasterCard'
  ];
  
  for (const invoice of invoicesWithPayments) {
    const paymentDate = faker.date.between({ 
      from: invoice.invoiceDate, 
      to: new Date() 
    });
    
    paymentsToCreate.push({
      invoiceId: invoice.id,
      paymentDate,
      amount: faker.number.float({ 
        min: invoice.totalAmount * 0.5, 
        max: invoice.totalAmount, 
        multipleOf: 1000 
      }),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      transactionId: faker.helpers.maybe(() => 
        `GD-${faker.string.numeric(12)}`, 
        { probability: 0.7 }
      ),
      notes: faker.helpers.maybe(() => faker.helpers.arrayElement(ghiChuThanhToan), { probability: 0.3 }),
    });
  }
  
  const paymentsResult = await prisma.payment.createMany({ data: paymentsToCreate, skipDuplicates: true });
  console.log(`✅ Created ${paymentsResult.count} payments`);

  // Lấy tổng số cho các bảng relationships
  console.log('\n📊 Counting total records...');
  const [totalFabricShelves, totalFabricStores, totalImportFabrics, totalImportItems, totalExportFabrics, totalExportItems, totalWarehouseManages, totalOrders, totalOrderItems, totalInvoices, totalPayments] = await Promise.all([
    prisma.fabricShelf.count(),
    prisma.fabricStore.count(),
    prisma.importFabric.count(),
    prisma.importFabricItem.count(),
    prisma.exportFabric.count(),
    prisma.exportFabricItem.count(),
    prisma.warehouseManage.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
  ]);

  // ANSI color codes
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
  };

  // Thống kê cuối cùng
  console.log('\n' + '='.repeat(60));
  console.log('🎉 OPTIMIZED MOCK DATA GENERATION COMPLETED!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${colors.green}${usersResult.count} new${colors.reset} / ${colors.cyan}${allUsers.length} total${colors.reset}`);
  console.log(`   - Fabric Categories: ${colors.green}${categoriesResult.count} new${colors.reset} / ${colors.cyan}${allCategories.length} total${colors.reset}`);
  console.log(`   - Fabric Colors: ${colors.green}${colorsResult.count} new${colors.reset} / ${colors.cyan}${allColors.length} total${colors.reset}`);
  console.log(`   - Fabric Gloss Levels: ${colors.green}${glossesResult.count} new${colors.reset} / ${colors.cyan}${allGlosses.length} total${colors.reset}`);
  console.log(`   - Suppliers: ${colors.green}${suppliersResult.count} new${colors.reset} / ${colors.cyan}${allSuppliers.length} total${colors.reset}`);
  console.log(`   - Warehouses: ${colors.green}${warehousesResult.count} new${colors.reset} / ${colors.cyan}${allWarehouses.length} total${colors.reset}`);
  console.log(`   - Stores: ${colors.green}${storesResult.count} new${colors.reset} / ${colors.cyan}${allStores.length} total${colors.reset}`);
  console.log(`   - Shelves: ${colors.green}${shelvesResult.count} new${colors.reset} / ${colors.cyan}${allShelves.length} total${colors.reset}`);
  console.log(`   - Fabrics: ${colors.green}${fabricsResult.count} new${colors.reset} / ${colors.cyan}${allFabrics.length} total${colors.reset}`);
  console.log(`   - Fabric-Shelf Relationships: ${colors.green}${fabricShelvesResult.count} new${colors.reset} / ${colors.cyan}${totalFabricShelves} total${colors.reset}`);
  console.log(`   - Fabric-Store Relationships: ${colors.green}${fabricStoresResult.count} new${colors.reset} / ${colors.cyan}${totalFabricStores} total${colors.reset}`);
  console.log(`   - Import Fabric Records: ${colors.green}${importFabricsResult.count} new${colors.reset} / ${colors.cyan}${totalImportFabrics} total${colors.reset}`);
  console.log(`   - Import Fabric Items: ${colors.green}${importItemsResult.count} new${colors.reset} / ${colors.cyan}${totalImportItems} total${colors.reset}`);
  console.log(`   - Export Fabric Records: ${colors.green}${exportFabricsResult.count} new${colors.reset} / ${colors.cyan}${totalExportFabrics} total${colors.reset}`);
  console.log(`   - Export Fabric Items: ${colors.green}${exportItemsResult.count} new${colors.reset} / ${colors.cyan}${totalExportItems} total${colors.reset}`);
  console.log(`   - Warehouse Managers: ${colors.green}${warehouseManagesResult.count} new${colors.reset} / ${colors.cyan}${totalWarehouseManages} total${colors.reset}`);
  console.log(`   - Orders: ${colors.green}${ordersResult.count} new${colors.reset} / ${colors.cyan}${totalOrders} total${colors.reset}`);
  console.log(`   - Order Items: ${colors.green}${orderItemsResult.count} new${colors.reset} / ${colors.cyan}${totalOrderItems} total${colors.reset}`);
  console.log(`   - Invoices: ${colors.green}${invoicesResult.count} new${colors.reset} / ${colors.cyan}${totalInvoices} total${colors.reset}`);
  console.log(`   - Payments: ${colors.green}${paymentsResult.count} new${colors.reset} / ${colors.cyan}${totalPayments} total${colors.reset}`);
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during mock data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
