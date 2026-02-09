/**
 * Laboratoriya API Unit Testlari
 * Jest framework bilan
 */

import request from 'supertest';
import mongoose from 'mongoose';

const API_URL = 'http://localhost:5004';
let authToken = '';
let testPatientId = '';
let testTestId = '';
let testOrderId = '';

describe('Laboratoriya API Testlari', () => {
  
  // Barcha testlardan oldin - Login
  beforeAll(async () => {
    const response = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authToken = response.body.token;
    expect(authToken).toBeDefined();
  });

  // Test 1: Tahlillarni olish
  describe('GET /api/v1/laboratory/tests', () => {
    it('Faol tahlillarni qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/laboratory/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ is_active: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        testTestId = response.body.data[0].id;
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.data[0]).toHaveProperty('price');
      }
    });

    it('Token bo\'lmasa 401 qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/laboratory/tests');

      expect(response.status).toBe(401);
    });
  });

  // Test 2: Bemorlarni olish
  describe('GET /api/v1/patients', () => {
    it('Bemorlar ro\'yxatini qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/patients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      
      if (response.body.data.length > 0) {
        testPatientId = response.body.data[0].id;
      }
    });
  });

  // Test 3: Buyurtma yaratish
  describe('POST /api/v1/laboratory/orders', () => {
    it('Yangi buyurtma yaratishi kerak', async () => {
      if (!testPatientId || !testTestId) {
        console.log('⚠️  Bemor yoki tahlil topilmadi, test o\'tkazib yuborildi');
        return;
      }

      const orderData = {
        patient_id: testPatientId,
        test_id: testTestId,
        priority: 'normal',
        notes: 'Jest unit test'
      };

      const response = await request(API_URL)
        .post('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('order_number');
      
      testOrderId = response.body.data.id;
    });

    it('Noto\'g\'ri ma\'lumot bilan 400 qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .post('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // Test 4: Buyurtmalarni olish
  describe('GET /api/v1/laboratory/orders', () => {
    it('Buyurtmalar ro\'yxatini qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Filtrlash ishlashi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  // Test 5: Statistika
  describe('GET /api/v1/laboratory/stats', () => {
    it('Statistikani qaytarishi kerak', async () => {
      const response = await request(API_URL)
        .get('/api/v1/laboratory/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total_orders');
      expect(response.body.data).toHaveProperty('pending_orders');
    });
  });

  // Barcha testlardan keyin - Cleanup
  afterAll(async () => {
    // Test buyurtmasini o'chirish (agar kerak bo'lsa)
    if (testOrderId) {
      // await request(API_URL)
      //   .delete(`/api/v1/laboratory/orders/${testOrderId}`)
      //   .set('Authorization', `Bearer ${authToken}`);
    }
  });
});
