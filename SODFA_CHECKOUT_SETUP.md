# SODFA checkout / WhatsApp setup

## Store WhatsApp number
Add the store's WhatsApp number to the frontend environment:

```env
VITE_WHATSAPP_NUMBER=2010XXXXXXXXX
```

Use the international format without `+`, spaces, or dashes.

The cart checkout collects:
- Customer name
- Customer mobile
- Governorate
- Full address
- Optional order notes

The checkout opens WhatsApp with a pre-filled order message. The customer still confirms/sends the message from WhatsApp; the website does not silently send messages on the customer's behalf.

Shipping is intentionally **not free**. The current UI tells the customer that shipping is calculated from the selected governorate/address and the final shipping amount is confirmed before the order is finalized. Add your actual governorate shipping table later when the delivery rates are finalized.

## Future n8n step
The WhatsApp message format is intentionally structured so the future n8n automation can parse:
- customer name
- customer phone
- governorate
- address
- notes
- product lines
- quantities
- subtotal
- shipping placeholder
