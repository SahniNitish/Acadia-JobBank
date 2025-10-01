-- Function to generate secure file paths for resume uploads
CREATE OR REPLACE FUNCTION generate_resume_path(file_extension TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN auth.uid()::text || '/' || 'resume_' || extract(epoch from now())::bigint || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file upload
CREATE OR REPLACE FUNCTION validate_resume_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size (5MB limit)
  IF file_size > 5242880 THEN
    RAISE EXCEPTION 'File size exceeds 5MB limit';
  END IF;
  
  -- Check mime type
  IF mime_type NOT IN (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) THEN
    RAISE EXCEPTION 'Invalid file type. Only PDF and Word documents are allowed';
  END IF;
  
  -- Check file extension
  IF NOT (
    file_name ILIKE '%.pdf' OR
    file_name ILIKE '%.doc' OR
    file_name ILIKE '%.docx'
  ) THEN
    RAISE EXCEPTION 'Invalid file extension. Only .pdf, .doc, and .docx files are allowed';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;