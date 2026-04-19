import type { DocumentVersionResponse, FileAttachmentResponse } from '../../types/api';
import { formatDateTime } from '../../lib/format';
import { EmptyState } from '../ui/EmptyState';
import { AttachmentList } from './AttachmentList';

export function DocumentVersions({
  versions,
  onDownload,
}: {
  versions: DocumentVersionResponse[];
  onDownload: (attachment: FileAttachmentResponse) => void;
}): JSX.Element {
  if (!versions.length) {
    return <EmptyState title="Версий пока нет" description="После сохранения черновика или доработки версии появятся здесь." />;
  }

  return (
    <div className="list-stack">
      {[...versions].sort((a, b) => b.versionNumber - a.versionNumber).map((version) => (
        <article key={version.id} className="version-card">
          <div className="version-card-head">
            <div>
              <div className="version-card-title">Версия #{version.versionNumber}</div>
              <div className="version-card-meta">{formatDateTime(version.createdAt)}</div>
            </div>
            <div className="version-card-comment">{version.changeComment || 'Комментарий к изменению не указан.'}</div>
          </div>
          <AttachmentList items={version.attachments} onDownload={onDownload} />
        </article>
      ))}
    </div>
  );
}
