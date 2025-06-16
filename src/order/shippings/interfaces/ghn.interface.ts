export interface GHNCreateOrderRequest {
  payment_type_id: number; // 1: Người gửi trả phí, 2: Người nhận trả phí
  note?: string;
  required_note: string; // KHONGCHOXEMHANG, CHOXEMHANGKHONGTHU, CHOTHUHANG
  return_phone: string;
  return_address: string;
  return_district_id: number;
  return_ward_code: string;
  client_order_code?: string;
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  cod_amount?: number;
  content: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  pick_station_id?: number;
  deliver_station_id?: number;
  insurance_value?: number;
  service_id: number;
  service_type_id: number; // 2: E-commerce
  coupon?: string;
  pickup_time?: number;
  items: GHNOrderItem[];
}

export interface GHNOrderItem {
  name: string;
  code?: string;
  quantity: number;
  price?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  category?: {
    level1?: string;
    level2?: string;
    level3?: string;
  };
}

export interface GHNCreateOrderResponse {
  code: number;
  message: string;
  data: {
    order_code: string;
    sort_code: string;
    trans_type: string;
    ward_encode: string;
    district_encode: string;
    fee: {
      main_service: number;
      insurance: number;
      cod_fee: number;
      station_do: number;
      station_pu: number;
      return: number;
      r2s: number;
      return_again: number;
      coupon: number;
      document_return: number;
      double_check: number;
      cod_failed_fee: number;
      pick_remote_areas_fee: number;
      deliver_remote_areas_fee: number;
      pick_remote_areas_fee_return: number;
      deliver_remote_areas_fee_return: number;
      cod_pick_remote_areas_fee: number;
      cod_deliver_remote_areas_fee: number;
    };
    total_fee: number;
    expected_delivery_time: string;
  };
}

export interface GHNTrackingResponse {
  code: number;
  message: string;
  data: {
    order_code: string;
    sort_code: string;
    transport: string;
    status: string;
    payment_type: string;
    service: string;
    expected_delivery_time: string;
    logs: GHNLog[];
  };
}

export interface GHNLog {
  status: string;
  updated_date: string;
  description: string;
}

export interface GHNCalculateFeeRequest {
  from_district_id: number;
  from_ward_code: string;
  to_district_id: number;
  to_ward_code: string;
  height: number;
  length: number;
  weight: number;
  width: number;
  insurance_value?: number;
  cod_amount?: number;
  coupon?: string;
  service_id: number;
  service_type_id: number;
}

export interface GHNCalculateFeeResponse {
  code: number;
  message: string;
  data: {
    total: number;
    service_fee: number;
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
    return_again: number;
    document_return: number;
    double_check: number;
    cod_fee: number;
    pick_remote_areas_fee: number;
    deliver_remote_areas_fee: number;
    pick_remote_areas_fee_return: number;
    deliver_remote_areas_fee_return: number;
    cod_pick_remote_areas_fee: number;
    cod_deliver_remote_areas_fee: number;
  };
}

export interface GHNProvinceResponse {
  code: number;
  message: string;
  data: GHNProvince[];
}

export interface GHNProvince {
  ProvinceID: number;
  ProvinceName: string;
  CountryID: number;
  Code: string;
}

export interface GHNDistrictResponse {
  code: number;
  message: string;
  data: GHNDistrict[];
}

export interface GHNDistrict {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
  Code: string;
  Type: number;
  SupportType: number;
}

export interface GHNWardResponse {
  code: number;
  message: string;
  data: GHNWard[];
}

export interface GHNWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
}

export interface GHNServiceResponse {
  code: number;
  message: string;
  data: GHNService[];
}

export interface GHNService {
  service_id: number;
  short_name: string;
  service_type_id: number;
}

// Mapping GHN status to our shipping status
export enum GHNOrderStatus {
  READY_TO_PICK = 'ready_to_pick',
  PICKING = 'picking',
  CANCEL = 'cancel',
  MONEY_COLLECT_PICKING = 'money_collect_picking',
  PICKED = 'picked',
  STORING = 'storing',
  TRANSPORTING = 'transporting',
  SORTING = 'sorting',
  DELIVERING = 'delivering',
  MONEY_COLLECT_DELIVERING = 'money_collect_delivering',
  DELIVERED = 'delivered',
  DELIVERY_FAIL = 'delivery_fail',
  WAITING_TO_RETURN = 'waiting_to_return',
  RETURN = 'return',
  RETURN_TRANSPORTING = 'return_transporting',
  RETURN_SORTING = 'return_sorting',
  RETURNING = 'returning',
  RETURN_FAIL = 'return_fail',
  RETURNED = 'returned',
  EXCEPTION = 'exception',
  DAMAGE = 'damage',
  LOST = 'lost',
}
