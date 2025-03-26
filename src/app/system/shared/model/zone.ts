export interface Zone {
  id: string;
  type: ZoneType;
  location: string;
}

export enum ZoneType {
  FROM = 'FROM',
  TO = 'TO',
}