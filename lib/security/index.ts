export {
  EnvelopeEncryptionService,
  createEnvelopeEncryptionService,
  createEnvelopeEncryptionServiceForProvider,
  type EncryptionEnvelope,
  type KMSConfig,
  type KMSProvider,
} from './envelope-encryption';

export {
  TamperProofAuditLogger,
  getAuditLogger,
  logSecurityEvent,
  type AuditEntry,
  type AuditLogConfig,
} from './tamper-proof-audit';

export {
  HSMKeyManagementService,
  MultiPartyAuthorizationService,
  getHSMService,
  type HSMConfig,
  type HSMProvider,
  type KeyMetadata,
  type SplitKeyShare,
  type MultiPartyAuthorizationConfig,
  type PendingOperation,
} from './hsm-key-management';
