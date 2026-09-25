import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive  } from '@angular/router';
import { Auth } from '../../services/auth';
import { Files } from '../../services/files';
import { File } from '../../models/file';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-my-space',
  styleUrl: './my-space.css',
  templateUrl: './my-space.html',
})
export class MySpace {
  constructor() {
    this.loadFiles();
  }

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly files = inject(Files);

  readonly filesList = signal<File[]>([]);
  readonly selectedFilter = signal<'all' | 'active' | 'expired'>('all');
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  loadFiles(): void {
    this.files.getFiles().subscribe({
      next: (files) => {
        this.filesList.set(files);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers', error);
      },
    });
  }

  getDaysRemaining(expirationDate: string): number {
    const expiration = new Date(expirationDate);
    const now = new Date();

    const difference = expiration.getTime() - now.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  getDownloadToken(downloadUrl: string): string {
    return downloadUrl.split('/').pop()!;
  }

  deleteFile(id: number): void {
    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer ce fichier ?'
    );

    if (!confirmed) {
      return;
    }

    this.files.deleteFile(id).subscribe({
      next: () => {
        this.filesList.update((files) =>
          files.filter((file) => file.id !== id)
        );
      },
      error: (error) => {
        console.error(
          'Erreur lors de la suppression du fichier',
          error
        );
      },
    });
  }

  getFilteredFiles(): File[] {
    const files = this.filesList();
    const filter = this.selectedFilter();

    if (filter === 'active') {
      return files.filter(
        (file) => new Date(file.expirationDate) > new Date()
      );
    }

    if (filter === 'expired') {
      return files.filter(
        (file) => new Date(file.expirationDate) <= new Date()
      );
    }

    return files;
  }
}