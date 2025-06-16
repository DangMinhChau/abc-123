export enum ShippingStatus {
  PENDING = 'pending', // Order is placed but not yet shipped
  PROCESSING = 'processing', // Order is being processed
  SHIPPED = 'shipped', // Order has been shipped
  IN_TRANSIT = 'in_transit', // Order is in transit
  OUT_FOR_DELIVERY = 'out_for_delivery', // Order is out for delivery
  DELIVERED = 'delivered', // Order has been delivered to the customer
  RETURNED = 'returned', // Order has been returned by the customer
  CANCELLED = 'cancelled', // Order has been cancelled
  FAILED = 'failed', // Shipping failed for some reason
  UNKNOWN = 'unknown', // Unknown status
}
