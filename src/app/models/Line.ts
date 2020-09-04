import { AddressLine } from './AddressLine';

export class Line {
  id: number;
  textLine: string;
  isAnAddress: boolean;
  isCurrent: boolean;
  parsedLine: AddressLine;
}