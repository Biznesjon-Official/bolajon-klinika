/**
 * Qabulxona Roli Unit Testlari
 * Reception rolining laboratoriya ruxsatlarini test qiladi
 */

import request from 'supertest';

const API_URL = 'http://localhost:5004';

describe('Qabulxona Roli - Laboratoriya Ruxsatlari', () => {
  
  const testUsers = [
    { role: 'admin', username: 'admin', password: 'admin123' },
    { role: 'reception', username: 'reception', password: 'reception123' }
  ];

  testUsers.forEach(user => {
    describe(`${user.role.toUpperCase()} roli`, () => {
      let authToken = '';

      beforeAll(async () => {
        try {
          const response = await request(API_URL)
            .post('/api/v1/auth/login')
            .send({
              username: user.username,
              password: user.password
            });

          if (response.body.token) {
            authToken = response.body.token;
          }
        } catch (error) {
          console.log(`⚠️  ${user.role} user topilmadi`);
        }
      });

      it('Login qila olishi kerak', () => {
        expect(authToken).toBeDefined();
        expect(authToken.length).toBeGreaterThan(0);
      });

      it('Tahlillarni ko\'ra olishi kerak', async () => {
        if (!authToken) {
          console.log(`⚠️  ${user.role} token yo'q, test o'tkazib yuborildi`);
          return;
        }

        const response = await request(API_URL)
          .get('/api/v1/laboratory/tests')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ is_active: true });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
      });

      it('Buyurtmalarni ko\'ra olishi kerak', async () => {
        if (!authToken) {
          console.log(`⚠️  ${user.role} token yo'q, test o'tkazib yuborildi`);
          return;
        }

        const response = await request(API_URL)
          .get('/api/v1/laboratory/orders')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
      });

      it('Buyurtma yarata olishi kerak', async () => {
        if (!authToken) {
          console.log(`⚠️  ${user.role} token yo'q, test o'tkazib yuborildi`);
          return;
        }

        // Avval bemor va tahlil olish
        const [patientsRes, testsRes] = await Promise.all([
          request(API_URL)
            .get('/api/v1/patients')
            .set('Authorization', `Bearer ${authToken}`),
          request(API_URL)
            .get('/api/v1/laboratory/tests')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ is_active: true })
        ]);

        if (patientsRes.body.data?.length > 0 && testsRes.body.data?.length > 0) {
          const orderData = {
            patient_id: patientsRes.body.data[0].id,
            test_id: testsRes.body.data[0].id,
            priority: 'normal',
            notes: `Jest test - ${user.role}`
          };

          const response = await request(API_URL)
            .post('/api/v1/laboratory/orders')
            .set('Authorization', `Bearer ${authToken}`)
            .send(orderData);

          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('success', true);
          expect(response.body.data).toHaveProperty('order_number');
        } else {
          console.log('⚠️  Bemor yoki tahlil topilmadi');
        }
      });
    });
  });
});
