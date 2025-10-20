const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserPasswords() {
  try {
    // Hash delle password
    const adminPassword = await bcrypt.hash('admin123', 10);
    const ristorante1Password = await bcrypt.hash('ristorante1', 10);
    
    // Aggiorna admin@demorestaurant.com
    const adminUser = await prisma.user.update({
      where: { email: 'admin@demorestaurant.com' },
      data: { password: adminPassword }
    });
    console.log('Admin user updated:', adminUser.email);
    
    // Aggiorna ristorante1@example.com
    const ristorante1User = await prisma.user.update({
      where: { email: 'ristorante1@example.com' },
      data: { password: ristorante1Password }
    });
    console.log('Ristorante1 user updated:', ristorante1User.email);
    
    console.log('All users updated successfully!');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPasswords();
