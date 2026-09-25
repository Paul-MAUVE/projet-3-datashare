import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Files } from '../../services/files';

interface DownloadFile {
  fileName: string;
  mimeType: string;
  size: number;
  expirationDate: string;
  downloadUrl: string;
  expiresIn: number;
}

@Component({
  imports: [RouterLink],
  selector: 'app-download',
  styleUrl: './download.css',
  templateUrl: './download.html',
})
export class Download {
  private readonly route = inject(ActivatedRoute);
  private readonly files = inject(Files);

  readonly downloadToken =
    this.route.snapshot.paramMap.get('downloadToken');

  readonly file = signal<DownloadFile | null>(null);
  readonly error = signal(false);

  isLoggedIn = localStorage.getItem('accessToken') !== null;

  constructor() {
    if (!this.downloadToken) {
      return;
    }

    this.files
      .getDownloadInfo(`/api/download/${this.downloadToken}`)
      .subscribe({
        next: (file) => {
          console.log('FICHIER REÇU :', file);
          this.file.set(file);
        },
        error: (error) => {
          console.error(
            'Erreur lors de la récupération du fichier',
            error
          );

          this.error.set(true);
        },
      });
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  getDaysRemaining(expirationDate: string): number {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const difference = expiration.getTime() - now.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  }

  getExpirationStatus(expirationDate: string): 'safe' | 'warning' | 'expired' {
    const daysRemaining = this.getDaysRemaining(expirationDate);

    if (daysRemaining <= 0) {
      return 'expired';
    }

    if (daysRemaining === 1) {
      return 'warning';
    }

    return 'safe';
  }

  downloadFile(): void {
    const downloadUrl = this.file()?.downloadUrl;

    if (!downloadUrl) {
      return;
    }

    fetch(downloadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement');
        }

        return response.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = this.file()!.fileName;

        link.click();

        URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Erreur lors du téléchargement du fichier', error);
      });
  }
}