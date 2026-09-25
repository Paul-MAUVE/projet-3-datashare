import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Uploads } from '../../services/uploads';
import type { UploadResult } from '../../models/upload-result';

@Component({
  imports: [RouterLink],
  selector: 'app-upload',
  styleUrl: './upload.css',
  templateUrl: './upload.html',
})
export class Upload {
  private readonly uploads = inject(Uploads);  
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  uploadResult: UploadResult | null = null;
  selectedFile: File | null = null;
  fileTooLarge = false;
  expirationDays = 7;
  linkCopied = false;
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];

    const maxFileSize = 1073741824;

    this.fileTooLarge = this.selectedFile.size > maxFileSize;

    console.log('Fichier sélectionné :', this.selectedFile);
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1).replace('.', ',')} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  }

  createUpload(): void {
    if (!this.selectedFile || this.fileTooLarge) {
      return;
    }

    const upload = {
      fileName: this.selectedFile.name,
      size: this.selectedFile.size,
      mimeType: this.selectedFile.type,
      expirationDays: this.expirationDays,
    };

    this.uploads.createUpload(upload).subscribe({
      next: (response) => {
        console.log('SESSION D’UPLOAD :', response);

        this.uploads
          .uploadFile(response.uploadUrl, this.selectedFile!)
          .subscribe({
            next: () => {
              console.log('FICHIER ENVOYÉ AVEC SUCCÈS');

              this.uploads.completeUpload(response.uploadId).subscribe({
                next: (file) => {
                  this.uploadResult = file;
                  this.changeDetectorRef.detectChanges();
                },
                error: (error) => {
                  console.error(
                    'Erreur lors de la finalisation de l’upload',
                    error
                  );
                },
              });
            },
            error: (error) => {
              console.error(
                'Erreur lors de la création de l’upload',
                error
              );
            },
          });
      }
    });
  }
  
  getDaysRemaining(expirationDate: string): number {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const difference = expiration.getTime() - now.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  }

  copyDownloadLink(): void {
    if (!this.uploadResult) {
      return;
    }

    const downloadLink = this.getDownloadLink();

    navigator.clipboard.writeText(downloadLink).then(() => {
      this.linkCopied = true;
      this.changeDetectorRef.detectChanges();

      setTimeout(() => {
        this.linkCopied = false;
        this.changeDetectorRef.detectChanges();
      }, 2000);
    });
  }

  getDownloadLink(): string {
    if (!this.uploadResult) {
      return '';
    }

    const downloadToken = this.uploadResult.downloadUrl.split('/').pop();

    return `${window.location.origin}/download/${downloadToken}`;
  }
}