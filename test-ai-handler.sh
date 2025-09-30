#!/bin/bash

echo "Testing AI Handler after Replit restart..."

echo "1. Testing Demo Route (should work immediately):"
curl -X POST "http://localhost:5000/api/analyze-assessment-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "test-after-restart",
    "moduleType": "post_secondary",
    "documents": [
      {
        "filename": "test.pdf",
        "content": "Processing speed deficits noted. Sustained attention difficulties. Working memory limitations."
      }
    ]
  }'

echo -e "\n\n2. Testing Live OpenAI Integration:"
curl -X POST "http://localhost:5000/api/analyze-assessment-simple" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "test-live-openai",
    "moduleType": "post_secondary",
    "documents": [
      {
        "filename": "assessment.pdf",
        "content": "WAIS-V Processing Speed Index 75 (5th percentile). Sustained attention difficulties during CPT. Executive function deficits in set-shifting tasks."
      }
    ]
  }'

echo -e "\n\nTest completed!"