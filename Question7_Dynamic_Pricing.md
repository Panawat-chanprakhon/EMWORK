# Question 7: Dynamic Pricing Engine

Delivery Fee สามารถเปลี่ยนตาม Customer Demand และจำนวน Rider ที่ว่างในขณะนั้น

ตัวอย่าง ถ้ามี Order จำนวนมาก แต่มี Rider ว่างน้อย ระบบสามารถเพิ่ม Delivery Fee ได้ โดย AI Model จะทำหน้าที่แนะนำราคา แต่ไม่สามารถกำหนดราคาสุดท้ายที่แสดงให้ลูกค้าได้โดยตรง

ข้อมูลที่สามารถใช้ได้ เช่น:

- จำนวน Rider ที่ว่าง
- จำนวน Active Orders
- จำนวน Order ที่กำลังรอ Rider
- พื้นที่
- ช่วงเวลา
- สภาพอากาศ

Architecture:

```text
Rider App
    |
    | Rider location and availability
    v
Backend Server
    |
    | Rider Supply + Customer Demand
    v
AI Pricing Model
    |
    | Recommended Price
    v
Hard-coded Pricing Rules
    |
    | Approved Final Price
    v
Customer App
```

ตัวอย่าง ถ้าค่าส่งปกติคือ 40 บาท และ AI Model แนะนำ Multiplier เท่ากับ 1.5 ค่าส่งที่เสนอจะเป็น 60 บาท

แต่ก่อนแสดงราคาให้ลูกค้า ผลลัพธ์ต้องผ่าน Hard-coded Pricing Rules ก่อน

```javascript
function applyPricingGuardrail(
    normalDeliveryFee,
    recommendedPriceMultiplier
) {

    // Example maximum. The real value should follow
    // approved business and consumer protection rules.
    const MAXIMUM_PRICE_MULTIPLIER = 2;


    // Invalid AI output falls back to the normal fee.
    if (
        !Number.isFinite(recommendedPriceMultiplier) ||
        recommendedPriceMultiplier < 1
    ) {
        return normalDeliveryFee;
    }
    

    // AI cannot recommend a multiplier above the fixed maximum.
    const finalPriceMultiplier =
        Math.min(
            recommendedPriceMultiplier,
            MAXIMUM_PRICE_MULTIPLIER
        );

    return normalDeliveryFee * finalPriceMultiplier;
}
```

ตัวอย่าง ถ้า AI แนะนำราคาเป็น 3 เท่าของราคาปกติ แต่ระบบกำหนด Maximum Multiplier ไว้ที่ 2 ระบบจะใช้ค่า 2 แทน

```text
Normal Fee: 40 Baht
AI Recommendation: 3
Maximum Allowed Multiplier: 2
Final Delivery Fee: 80 Baht
```

Maximum Price ควรถูกกำหนดจาก Business Rules ที่ได้รับอนุมัติและข้อกำหนดด้านการคุ้มครองผู้บริโภค โดย AI Model ไม่สามารถแก้ไข Limit นี้ได้

ผมจะเพิ่ม Safety Rules เช่น:

- ถ้า AI ส่งค่าที่ไม่ถูกต้องหรือค่าติดลบ ให้ใช้ราคาปกติแทน
- แสดง Final Delivery Fee ให้ลูกค้าเห็นก่อน Confirm Order
- เก็บประวัติ Normal Fee, AI Recommendation, Final Fee, Area และ Time
- ถ้า AI Service ใช้งานไม่ได้ ให้กลับไปใช้ Normal Pricing Rules

ดังนั้น AI ทำหน้าที่แนะนำราคา ส่วนราคาสุดท้ายที่ลูกค้าจ่ายยังถูกควบคุมด้วย Fixed System Rules