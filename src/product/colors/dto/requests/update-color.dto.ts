// import { PartialType } from '@nestjs/mapped-types';
import { CreateColorDto } from './create-color.dto';
import { PartialType } from '@nestjs/swagger';
export class UpdateColorDto extends PartialType(CreateColorDto) {}
