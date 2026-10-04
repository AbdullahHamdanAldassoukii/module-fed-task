import { describe, expect, it, rs } from '@rstest/core';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { FileFieldFile } from '../api';
import { FileField } from '../testing/kit';
import { renderKit } from '../testing/renderKit';

const labels = {
  choose: 'Choose file',
  drop: 'Drop your passport here',
  replace: 'Replace',
  remove: 'Remove',
};
const base = {
  id: 'doc',
  label: 'Passport document',
  accept: ['application/pdf', 'image/png'],
  labels,
};
const pdf = new File(['%PDF-1.4'], 'passport.pdf', { type: 'application/pdf' });
const png = new File(['png'], 'scan.png', { type: 'image/png' });
const chosen: FileFieldFile = {
  name: 'passport.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2048,
};

/** A drop as browsers deliver it: react-dropzone reads dropped files from dataTransfer.items. */
const dropFiles = (zone: HTMLElement, files: File[]) => {
  fireEvent.drop(zone, {
    dataTransfer: {
      files,
      items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      types: ['Files'],
    },
  });
};

/** The picker opens through the file input; stub it so the test sees the request. */
const stubPicker = () =>
  rs.spyOn(screen.getByLabelText(/Passport document/), 'click').mockImplementation(() => {});

/**
 * A parent like the form: busy while it reads a picked file, then shows it. Reading ends when
 * the test says so; the form may show the file only once it is read, or already while it reads.
 */
const renderPicking = ({ showWhileReading }: { showWhileReading: boolean }) => {
  const reading = { finish: () => {} };
  function Picking() {
    const [file, setFile] = useState<FileFieldFile | null>(null);
    const [busyLabel, setBusyLabel] = useState<string | null>(null);
    return (
      <>
        <FileField
          {...base}
          file={file}
          busyLabel={busyLabel}
          onFilesSelected={([picked]) => {
            if (!picked) return;
            const shown = { name: picked.name, mimeType: picked.type, sizeBytes: picked.size };
            setBusyLabel('Reading file…');
            if (showWhileReading) setFile(shown);
            reading.finish = () => {
              setBusyLabel(null);
              setFile(shown);
            };
          }}
        />
        <button type="button">Next</button>
      </>
    );
  }
  renderKit(<Picking />);
  return {
    finishReading: () => {
      act(() => {
        reading.finish();
      });
    },
  };
};

/** Choose file from the keyboard, and the native picker hands back a file without moving focus. */
const pickFromKeyboard = async (file: File) => {
  const picker = stubPicker();
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  expect(picker).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText(/Passport document/), { target: { files: [file] } });
  await screen.findByRole('progressbar', { name: 'Reading file…' });
};

describe('FileField', () => {
  it('has a labelled single-file input with an accept hint', () => {
    renderKit(<FileField {...base} onFilesSelected={() => {}} />);
    const input = screen.getByLabelText(/Passport document/);
    expect(input).toHaveAttribute('type', 'file');
    expect(input).not.toHaveAttribute('multiple');
    expect(input).toHaveAttribute('accept', 'application/pdf,image/png');
  });
  it('reports a picked file', async () => {
    const onFilesSelected = rs.fn();
    renderKit(<FileField {...base} onFilesSelected={onFilesSelected} />);
    await userEvent.upload(screen.getByLabelText(/Passport document/), pdf);
    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledWith([pdf]);
    });
  });
  it('reports every dropped file so the form can reject "too many"', async () => {
    const onFilesSelected = rs.fn();
    renderKit(<FileField {...base} onFilesSelected={onFilesSelected} />);
    const zone = screen.getByTestId('file-dropzone');
    dropFiles(zone, [pdf, png]);
    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledTimes(1);
    });
    expect(onFilesSelected.mock.calls[0]?.[0]).toHaveLength(2);
  });
  it('shows the chosen file with replace and remove', async () => {
    const onRemove = rs.fn();
    renderKit(<FileField {...base} file={chosen} onFilesSelected={() => {}} onRemove={onRemove} />);
    expect(screen.getByText('passport.pdf')).toBeInTheDocument();
    expect(screen.getByText(/2(\.0)? KB/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
  });
  it('busy state shows progress and disables the control', () => {
    renderKit(<FileField {...base} busyLabel="Reading file…" onFilesSelected={() => {}} />);
    expect(screen.getByRole('progressbar', { name: 'Reading file…' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Passport document/)).toBeDisabled();
  });
  it('wires error', () => {
    renderKit(<FileField {...base} error="Only PDF or image" onFilesSelected={() => {}} />);
    expect(screen.getByLabelText(/Passport document/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Only PDF or image')).toHaveAttribute('id', 'doc-error');
  });
  it('names the file input by its visible label', () => {
    renderKit(<FileField {...base} required onFilesSelected={() => {}} />);
    const input = screen.getByLabelText(/Passport document/);
    expect(input).toHaveAccessibleName('Passport document');
    expect(input).toHaveAttribute('aria-required', 'true');
  });
  it('describes the button the keyboard reaches with the field label, hint and error', async () => {
    renderKit(
      <FileField
        {...base}
        required
        description="PDF, PNG or JPG"
        error="Only PDF or image"
        onFilesSelected={() => {}}
      />,
    );
    await userEvent.tab();
    const choose = screen.getByRole('button', { name: 'Choose file' });
    expect(choose).toHaveFocus();
    expect(choose).toHaveAccessibleDescription(/Passport document/);
    expect(choose).toHaveAccessibleDescription(/PDF, PNG or JPG/);
    expect(choose).toHaveAccessibleDescription(/Only PDF or image/);
    expect(choose).toHaveAttribute('aria-invalid', 'true');
  });
  it('describes Replace the same way once a file is chosen', () => {
    renderKit(
      <FileField {...base} file={chosen} error="Only PDF or image" onFilesSelected={() => {}} />,
    );
    const replace = screen.getByRole('button', { name: 'Replace' });
    expect(replace).toHaveAccessibleDescription(/Passport document/);
    expect(replace).toHaveAccessibleDescription(/Only PDF or image/);
    expect(replace).toHaveAttribute('aria-invalid', 'true');
  });
  it('opens the file picker from a button the keyboard reaches', async () => {
    renderKit(<FileField {...base} onFilesSelected={() => {}} />);
    const picker = stubPicker();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Choose file' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(picker).toHaveBeenCalledTimes(1);
  });
  it('opens the file picker from Replace', async () => {
    renderKit(<FileField {...base} file={chosen} onFilesSelected={() => {}} />);
    const picker = stubPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(picker).toHaveBeenCalledTimes(1);
  });
  it('moves focus to Choose file once the file is removed', async () => {
    function WithRemove() {
      const [file, setFile] = useState<FileFieldFile | null>(chosen);
      return (
        <FileField
          {...base}
          file={file}
          onFilesSelected={() => {}}
          onRemove={() => {
            setFile(null);
          }}
        />
      );
    }
    renderKit(<WithRemove />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByRole('button', { name: 'Choose file' })).toHaveFocus();
  });
  it('moves focus to Replace once the file picked from Choose file has been read', async () => {
    const { finishReading } = renderPicking({ showWhileReading: false });
    await pickFromKeyboard(pdf);
    finishReading();
    expect(screen.getByRole('button', { name: 'Replace' })).toHaveFocus();
  });
  it('moves focus to Replace once reading ends when the file shows while it is read', async () => {
    const { finishReading } = renderPicking({ showWhileReading: true });
    await pickFromKeyboard(pdf);
    finishReading();
    expect(screen.getByRole('button', { name: 'Replace' })).toHaveFocus();
  });
  it('leaves focus where the user moved it while the file was read', async () => {
    const { finishReading } = renderPicking({ showWhileReading: false });
    await pickFromKeyboard(pdf);
    const next = screen.getByRole('button', { name: 'Next' });
    await userEvent.click(next);
    finishReading();
    expect(next).toHaveFocus();
  });
});
