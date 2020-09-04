export interface Observation {
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
  id?: string;
  geometry: Geometry;
  height?: number;
  validAt?: string;
}

interface Geometry {
  type: string;
  coordinates: any;
}