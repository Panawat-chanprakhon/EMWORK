# Question 5: Rush Hour Cancellation Crisis

ในช่วง Rush Hour ผมจะใช้ Dynamic Incentive เพื่อเพิ่มโบนัสให้ Rider ในพื้นที่ที่มีจำนวน Order มาก แต่มี Rider ไม่เพียงพอ

ระบบสามารถดูข้อมูล เช่น:

- จำนวน Order ที่กำลังรอ Rider
- จำนวน Rider ที่ว่าง
- Cancellation Rate
- Average Pickup Waiting Time
- ช่วงเวลา
- สภาพอากาศ

ตัวอย่าง ถ้าพื้นที่หนึ่งมี Order รอจำนวนมาก มี Rider น้อย และมี Cancellation Rate สูง ระบบสามารถเพิ่มโบนัสในพื้นที่นั้นได้

```text
High Demand + Low Rider Supply
            |
            v
      Add Area Bonus
            |
            v
     Show Bonus to Rider
            |
            v
   More Riders Accept Orders
```

โบนัสควรมี Maximum Limit เพื่อป้องกันไม่ให้ระบบเพิ่มโบนัสสูงขึ้นเรื่อย ๆ และ Rider ควรเห็นจำนวนโบนัสก่อนกดรับ Order

## Cancellation Log

ผมจะเก็บประวัติการยกเลิกงานเพื่อใช้วิเคราะห์พฤติกรรมในภายหลัง

```sql
CREATE TABLE cancellation_log (
    cancellation_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    rider_id BIGINT NOT NULL,
    area_id BIGINT NOT NULL,
    accepted_at TIMESTAMP,
    cancelled_at TIMESTAMP NOT NULL,
    cancellation_reason VARCHAR(255),
    rider_latitude DECIMAL(9, 6),
    rider_longitude DECIMAL(9, 6),
    incentive_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

ข้อมูลนี้สามารถใช้หาพฤติกรรมที่ผิดปกติ เช่น Rider รับงานแล้วรีบยกเลิกหลายครั้ง หรือยกเลิกงานแล้วรอให้ Incentive ในพื้นที่เพิ่มขึ้นก่อนรับงานใหม่

ข้อมูลที่ผมจะนำมาดู เช่น จำนวนครั้งที่ยกเลิก ระยะเวลาระหว่างรับงานกับยกเลิก พื้นที่ เหตุผลในการยกเลิก และจำนวน Incentive

อย่างไรก็ตาม Cancellation Rate ที่สูงเพียงอย่างเดียวไม่ควรถูกตัดสินว่าเป็น Fraud เพราะอาจเกิดจากสาเหตุอื่น เช่น รถติด ร้านอาหารล่าช้า รถมีปัญหา หรือปัญหาด้านความปลอดภัย ดังนั้นควรวิเคราะห์จากพฤติกรรมหลายเหตุการณ์ร่วมกัน