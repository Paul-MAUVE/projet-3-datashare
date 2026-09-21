import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service.js';
import { ConfigModule } from '@nestjs/config'

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
      ],
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to the S3 bucket', async () => {
    // GIVEN: le StorageService est initialisé avec la configuration S3
    // WHEN: on vérifie l'existence du bucket
    await service.testConnection();

    // THEN: aucune erreur signifie que le bucket est accessible
    expect(true).toBe(true);
  });

  it('should upload an object to the S3 bucket', async () => {
    // GIVEN: un objet avec une clé, un contenu et un type MIME
    const storageKey = 'tests/storage-service-test.txt';
    const body = Buffer.from('DataShare S3 test');
    const contentType = 'text/plain';

    // WHEN: l'objet est envoyé vers le stockage
    await service.uploadObject(storageKey, body, contentType);

    // THEN: l'objet doit être accessible dans le bucket
    const metadata = await service.headObject(storageKey)
    expect(metadata.ContentLength).toBe(body.length);
  });

  it('should delete an object from the S3 bucket', async () => {
    // GIVEN: un objet existe dans le bucket
    const storageKey = 'tests/storage-service-delete-test.txt';
    const body = Buffer.from('DataShare delete test');
    const contentType = 'text/plain';

    await service.uploadObject(storageKey, body, contentType);
    await service.headObject(storageKey);

    // WHEN: l'objet est supprimé
    await service.deleteObject(storageKey);

    // THEN: l'objet ne doit plus exister
    await expect(service.headObject(storageKey)).rejects.toThrow();
  });

  it('should generate a presigned upload URL', async () => {
    // GIVEN: une clé de stockage et un type MIME
    const storageKey = 'tests/presigned-test.txt';
    const contentType = 'text/plain';

    // WHEN: une URL présignée d'upload est générée
    const uploadUrl = await service.generateUploadUrl(storageKey, contentType);

    // THEN: l'URL générée doit être une URL HTTP valide
    const url = new URL(uploadUrl);

    expect(url.protocol).toBe('http:');
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('9000');
  });

  it('should generate a presigned download URL', async () => {
    // GIVEN: une clé de stockage
    const storageKey = 'tests/presigned-test.txt';

    // WHEN: une URL présignée de téléchargement est générée
    const downloadUrl = await service.generateDownloadUrl(storageKey);

    // THEN: l'URL générée doit être une URL HTTP valide
    const url = new URL(downloadUrl);

    expect(url.protocol).toBe('http:');
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('9000');
  });

  it('should download an object using a presigned download URL', async () => {
    // GIVEN: un fichier de test stocké dans MinIO
    const storageKey = 'tests/presigned-download-test.txt';
    const content = 'Hello DataShare';

    await service.uploadObject(
      storageKey,
      Buffer.from(content),
      'text/plain',
    );

    // WHEN: une URL présignée de téléchargement est générée
    const downloadUrl = await service.generateDownloadUrl(storageKey);
    const response = await fetch(downloadUrl);

    // THEN: le téléchargement doit réussir
    expect(response.status).toBe(200);

    const downloadedContent = await response.text();

    expect(downloadedContent).toBe(content);

    // CLEANUP: supprimer le fichier de test
    await service.deleteObject(storageKey);
  });

  it('should upload an object using a presigned URL', async () => {
    // GIVEN: une clé et un contenu à uploader
    const storageKey = 'tests/presigned-upload-test.txt';
    const contentType = 'text/plain';
    const body = 'DataShare presigned upload test';

    // WHEN: une URL présignée est générée
    const uploadUrl = await service.generateUploadUrl(storageKey, contentType);

    // AND: le client utilise cette URL pour envoyer le fichier
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body,
    });

    // THEN: MinIO doit accepter l'upload
    expect(response.ok).toBe(true);

    // AND: l'objet doit réellement exister dans le bucket
    await service.headObject(storageKey);

    // CLEANUP: supprimer l'objet créé par le test
    await service.deleteObject(storageKey);
  });
});
