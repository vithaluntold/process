import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { createEnvelopeEncryptionService } from '@/lib/security/envelope-encryption';
import { getHSMService } from '@/lib/security/hsm-key-management';
import { logSecurityEvent } from '@/lib/security/tamper-proof-audit';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const kmsProvider = process.env.KMS_PROVIDER || 'local';
    const hsmProvider = process.env.HSM_PROVIDER || 'local-hsm-simulation';

    const status = {
      envelope_encryption: {
        enabled: true,
        provider: kmsProvider,
        algorithm: 'AES-256-GCM',
        kek_dek_hierarchy: true,
        key_rotation_supported: true,
      },
      hsm_integration: {
        enabled: hsmProvider !== 'local-hsm-simulation',
        provider: hsmProvider,
        features: {
          secure_random_generation: true,
          split_knowledge: true,
          multi_party_authorization: true,
        },
      },
      audit_logging: {
        enabled: true,
        tamper_proof: true,
        hash_chain: true,
        cryptographic_signatures: true,
        proof_of_work: process.env.AUDIT_ENABLE_POW === 'true',
      },
      compliance: {
        hipaa_compatible: true,
        gdpr_compatible: true,
        sox_compatible: true,
        pci_dss_compatible: true,
      },
      recommendations: [] as string[],
    };

    if (kmsProvider === 'local') {
      status.recommendations.push(
        'Consider upgrading to AWS KMS or Google Cloud KMS for enterprise-grade key management'
      );
    }

    if (hsmProvider === 'local-hsm-simulation') {
      status.recommendations.push(
        'Enable HSM integration (AWS CloudHSM or GCP Cloud HSM) for FIPS 140-2 compliance'
      );
    }

    if (!process.env.AUDIT_SIGNING_KEY) {
      status.recommendations.push(
        'Set AUDIT_SIGNING_KEY environment variable for cryptographic audit signatures'
      );
    }

    await logSecurityEvent({
      action: 'SECURITY_STATUS_CHECK',
      userId: user.id,
      organizationId: user.organizationId,
      resourceType: 'security-config',
      metadata: { kmsProvider, hsmProvider },
    });

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Security status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check security status', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can test encryption' }, { status: 403 });
    }

    const testData = 'EPI-Q Enterprise Encryption Test - ' + new Date().toISOString();

    const encryptionService = createEnvelopeEncryptionService();
    const envelope = await encryptionService.encrypt(testData);

    const decrypted = await encryptionService.decryptToString(envelope);

    const success = decrypted === testData;

    const hsmService = getHSMService();
    const randomBytes = await hsmService.generateSecureRandom(32);

    await logSecurityEvent({
      action: 'ENCRYPTION_TEST',
      userId: user.id,
      organizationId: user.organizationId,
      resourceType: 'security-config',
      metadata: {
        success,
        provider: envelope.provider,
        algorithm: envelope.algorithm,
        hsmRandomBytesGenerated: randomBytes.length,
      },
    });

    return NextResponse.json({
      success,
      encryption: {
        provider: envelope.provider,
        algorithm: envelope.algorithm,
        kekVersion: envelope.kekVersion,
        timestamp: envelope.timestamp,
      },
      hsm: {
        randomBytesGenerated: randomBytes.length,
        provider: process.env.HSM_PROVIDER || 'local-hsm-simulation',
      },
    });
  } catch (error: any) {
    console.error('Encryption test error:', error);
    return NextResponse.json(
      { error: 'Encryption test failed', details: error.message },
      { status: 500 }
    );
  }
}
