import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  // All fields from CreateAddressDto are now optional including isDefault
  // This allows updating address details and/or setting it as default in one request
}
