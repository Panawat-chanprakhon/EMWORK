# Question 6: Artificial Intelligence Delivery Time Predictor

ผมจะใช้ Prompt ประมาณนี้:

```text
Estimate the total delivery time in minutes using this information:

Distance: {distance_in_kilometers} kilometers
Weather: {weather_condition}
Restaurant preparation time: {restaurant_preparation_time} minutes

The total time should include both restaurant preparation time and travel time. Consider that rain can make the rider travel more slowly.

Return:
Estimated delivery time: [number] minutes
Reason: [short explanation]
```

ผมจะไม่ส่งผลลัพธ์จาก AI ไปให้ลูกค้าโดยตรง แต่จะตรวจสอบด้วย Validation Rules ก่อน

ตัวอย่าง ถ้าระยะทาง 10 กิโลเมตร ฝนตกหนัก และร้านใช้เวลาเตรียมอาหาร 15 นาที แต่ AI ตอบว่าใช้เวลาส่งทั้งหมด 5 นาที ระบบควร Reject ผลลัพธ์นี้ เพราะแค่เวลาเตรียมอาหารก็เกิน 5 นาทีแล้ว

ผมจะตรวจสอบว่า:

- Delivery Time ต้องไม่น้อยกว่า Restaurant Preparation Time
- Travel Time ต้องสมเหตุสมผลกับระยะทาง
- ฝนตกหนักไม่ควรทำให้ Travel Time ลดลง
- ค่าที่ต่ำหรือสูงผิดปกติ รวมถึงค่าที่ไม่ถูกต้อง จะถูก Reject

Flow:

```text
Input Data
    |
    v
AI Prediction
    |
    v
Validation Rules
    |
    +---- Valid ----> Show Estimated Time
    |
    +---- Invalid --> Use Fallback Calculation
```

ถ้าผลจาก AI ไม่ผ่าน Validation ระบบจะใช้การคำนวณแบบปกติแทน:

```text
Delivery Time
=
Restaurant Preparation Time
+
Estimated Travel Time
+
Weather Delay
```

แนวคิดคือให้ AI ช่วยในการประมาณเวลา แต่ยังมี Fixed Rules ป้องกันผลลัพธ์ที่ไม่สมเหตุสมผลก่อนแสดงให้ลูกค้า