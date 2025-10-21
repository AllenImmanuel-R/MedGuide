/**
 * Clinic Services Initialization
 * Sets up and exports LocationService and ClinicFinderService instances
 */

import LocationService from './LocationService';
import ClinicFinderService from './ClinicFinderService';

// Initialize services
const locationService = new LocationService();
const clinicFinderService = new ClinicFinderService(locationService);

// Export service instances
export { locationService, clinicFinderService };

// Export types for convenience
export type { UserLocation, LocationError } from './LocationService';
export type { Clinic, ClinicSearchOptions, MedicalSpecialization } from './ClinicFinderService';