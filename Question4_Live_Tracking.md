# Question 4: Real-time Live Tracking Architecture

Rider มีทั้งหมด 2,000 คน และส่งตำแหน่งทุก 2 วินาที ดังนั้นระบบจะได้รับข้อมูลตำแหน่งประมาณ 1,000 updates ต่อวินาที

ผมออกแบบ Data Flow แบบนี้:

```text
Rider App
   |
   | MQTT
   v
Tracking Server
   |
   v
Redis
   |
   v
Backend Server
   |
   | WebSocket
   v
Customer App
```

ผมเลือกใช้ MQTT สำหรับส่งตำแหน่งจาก Rider App ไปยัง Tracking Server เพราะข้อมูลตำแหน่งมีขนาดเล็กและถูกส่งบ่อย และเหมาะกับการเชื่อมต่อผ่านเครือข่ายมือถือ

ส่วน Customer App ผมเลือกใช้ WebSocket เพราะ Server สามารถส่งตำแหน่งใหม่ของ Rider ไปให้ลูกค้าได้ทันทีโดยไม่ต้อง refresh หน้า

สำหรับ Storage ผมจะไม่บันทึกทุก location update ลง SQL Database โดยตรง เพราะตำแหน่งมีการเปลี่ยนทุก 2 วินาที

ผมจะเก็บตำแหน่งล่าสุดของ Rider ไว้ใน Redis ซึ่งเป็น In-memory Storage

ตัวอย่าง:

```text
rider:1001
latitude: 13.7563
longitude: 100.5018
updated_at: 14:00:00
```

ถ้าต้องการเก็บ Location History ผมจะบันทึกแยกต่างหากด้วยความถี่ที่ต่ำลง เช่น ทุก 30 วินาที หรือเมื่อเกิด Event สำคัญ เช่น Rider รับอาหารหรือส่งอาหารสำเร็จ

ส่วน gRPC สามารถใช้สำหรับการสื่อสารระหว่าง Backend Services ได้ แต่สำหรับโจทย์นี้ผมเลือก MQTT สำหรับ Rider App และ WebSocket สำหรับ Customer App