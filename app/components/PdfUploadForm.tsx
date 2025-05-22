'use client';

import React, { useState, ChangeEvent, FormEvent, useRef, useCallback, useMemo } from 'react';
import styles from './PdfUploadForm.module.css';
import { marked } from 'marked';
import { saveAs } from 'file-saver'; // For triggering download

export default function PdfUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File | null) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setSummaryMarkdown('');
      setErrorMessage('');
      setProgressMessages([]);
    } else if (file) {
      setErrorMessage('Invalid file type. Please upload a PDF.');
      setSelectedFile(null);
    } else {
      setSelectedFile(null);
      setErrorMessage('');
    }
    
    // Add a small delay before resetting the input
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 100);
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file to summarize.');
      return;
    }
    setIsLoading(true);
    setSummaryMarkdown('');
    setErrorMessage('');
    setProgressMessages(['Processing your PDF document...']);
    
    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    
    try {
      // Display progress update
      setProgressMessages(prev => [...prev, 'Extracting text from PDF...']);
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });
      
      setProgressMessages(prev => [...prev, 'Processing response from server...']);
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.summary) {
          setProgressMessages(prev => [...prev, 'Summary generated successfully!']);
          setSummaryMarkdown(data.summary);
        } else {
          setErrorMessage('Received an empty summary from the server.');
        }
      } else {
        setErrorMessage(data.error || 'An error occurred while summarizing.');
      }
    } catch (error) {
      console.error('API call failed:', error);
      setErrorMessage('Could not connect to the summarization service. Please try again later.');
    } finally {
      setIsLoading(false);
      // Clear progress messages when done
      setTimeout(() => {
        setProgressMessages([]);
      }, 1000);
    }
  };

  const handleUploadAreaClick = useCallback((e: React.MouseEvent) => {
    // Stop propagation to prevent multiple triggers
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add(styles.dragOver);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.dragOver);
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.dragOver);
    processFile(event.dataTransfer.files && event.dataTransfer.files[0] ? event.dataTransfer.files[0] : null);
  }, []);

  const summaryHtml = useMemo(() => {
    if (summaryMarkdown) {
      return marked.parse(summaryMarkdown, { gfm: true, breaks: true });
    }
    return '';
  }, [summaryMarkdown]);

  const handleDownloadDocx = async () => {
    if (!summaryHtml) return;
    try {
      // Call the server-side API to convert HTML to DOCX
      const response = await fetch('/api/convert-to-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: summaryHtml }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert to DOCX');
      }

      // Get the file blob from the response
      const docxBlob = await response.blob();
      
      // Use file-saver to trigger the download
      saveAs(docxBlob, 'contract-summary.docx');
    } catch (err) {
      console.error("Error generating DOCX:", err);
      setErrorMessage("Could not generate DOCX file. Please try again or copy the text manually.");
    }
  };

  return (
    <>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} aria-label="PDF Upload Form">
          <div 
            className={styles.fileInputArea}
            onClick={handleUploadAreaClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-labelledby="file-upload-instructions"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { fileInputRef.current?.click(); } }}
          >
            <input
              id="pdf-file-upload"
              name="pdfFileUpload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              className={styles.hiddenInput}
              onClick={(e) => e.stopPropagation()} // Stop propagation to prevent double triggers
            />
            <div className={styles.fileInputTextContainer} id="file-upload-instructions">
              {selectedFile ? (
                <>
                  <p className={styles.fileInputMainText}>Change file</p>
                  <p className={styles.fileInputSubText}>{selectedFile.name}</p>
                </>
              ) : (
                <>
                  <p className={styles.fileInputMainText}>Select PDF File</p>
                  <p className={styles.fileInputSubText}>or drag and drop here</p>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
             <p className={styles.fileName}>Ready to summarize: {selectedFile.name}</p>
          )}
          
          {!isLoading && errorMessage && !summaryMarkdown && (
             <div className={styles.resultsContainer} style={{marginTop: '1.5rem'}}>
                <h3 className={styles.errorTitle}>Upload Issue</h3>
                <p className={styles.errorMessage}>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <div className={styles.modernSpinner}></div>
                Processing Contract...
              </>
            ) : 'Generate Summary'}

          </button>
        </form>
      </div>

      {isLoading && (
        <div className={styles.loadingSpinnerContainer}>
          <p className={styles.loadingText}>AI is analyzing your document. This may take a few moments...</p>
          {progressMessages.length > 0 && (
            <div className={styles.progressContainer}>
              {progressMessages.map((message, index) => (
                <p key={index} className={styles.progressMessage}>
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {(!isLoading && (summaryHtml || (errorMessage && !selectedFile && !summaryMarkdown))) && (
        <div className={styles.resultsContainer}>
          {summaryHtml && (
            <section aria-labelledby="summary-heading">
              <div className="flex justify-between items-center mb-4">
                <h3 id="summary-heading" className={styles.summaryTitle}>Summary Report</h3>
                <button 
                  onClick={handleDownloadDocx}
                  className={styles.downloadButton}
                >
                  Download as .docx
                </button>
              </div>
              <div
                className={styles.summaryContent}
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            </section>
          )}
          {errorMessage && !summaryHtml && ( 
            <section aria-labelledby="error-heading">
              <h3 id="error-heading" className={styles.errorTitle}>Summarization Error</h3>
              <p className={styles.errorMessage}>{errorMessage}</p>
            </section>
          )}
        </div>
      )}
    </>
  );
}