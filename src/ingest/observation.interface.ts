export interface ObservationClient {
  madeBySensor?: string;
  hasResult?: Result;
  resultTime?: string;
  location?: Location;
  observedProperty?: string;
  aggregation?: string;
  usedProcedures?: string[];
  phenomenonTime?: PhenomenonTime;
}

interface Result {
  value?: any;
  unit?: string;
  flags?: string[];
}

interface PhenomenonTime {
  hasBeginning: string;
  hasEnd: string;
}

interface Location {
  id?: number;
  geometry: Geometry;
  height?: number;
  validAt?: Date;
}

interface Geometry {
  type: string;
  coordinates: any;
}