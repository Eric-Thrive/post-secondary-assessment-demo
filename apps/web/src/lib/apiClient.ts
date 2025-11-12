// Simple API client to handle all server communication
class ApiClient {
  private baseUrl = "";

  async request(endpoint: string, options: RequestInit = {}) {
    let url = `${this.baseUrl}/api${endpoint}`;

    // Check for presentation token in session storage and add to URL
    const presentationToken = sessionStorage.getItem("presentationToken");
    if (presentationToken) {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set("p", presentationToken);
      url = urlObj.toString();
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `HTTP ${response.status}`;

      if (contentType?.includes("application/json")) {
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  // Assessment cases
  async getAssessmentCases(moduleType: string) {
    // Check if we're in demo mode and use appropriate endpoint
    const environment =
      localStorage.getItem("app-environment") || "replit-prod";
    const isDemoEnvironment = environment.includes("demo");

    console.log("=== apiClient.getAssessmentCases Debug ===");
    console.log("Module Type:", moduleType);
    console.log("Environment from localStorage:", environment);
    console.log("Is Demo Environment:", isDemoEnvironment);
    console.log(
      "Endpoint will be:",
      isDemoEnvironment
        ? `/demo-assessment-cases/${moduleType}`
        : `/assessment-cases/${moduleType}`
    );

    if (isDemoEnvironment) {
      console.log(`✅ Using DEMO endpoint for ${moduleType} cases`);
      return this.request(`/demo-assessment-cases/${moduleType}`);
    } else {
      console.log(`📋 Using STANDARD endpoint for ${moduleType} cases`);
      return this.request(`/assessment-cases/${moduleType}`);
    }
  }

  async getAssessmentCase(caseId: string) {
    return this.request(`/assessment-cases/${caseId}`);
  }

  async createAssessmentCase(caseData: any) {
    return this.request("/assessment-cases", {
      method: "POST",
      body: JSON.stringify(caseData),
    });
  }

  async updateAssessmentCase(caseId: string, updateData: any) {
    return this.request(`/assessment-cases/${caseId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  }

  async deleteAssessmentCase(caseId: string) {
    return this.request(`/assessment-cases/${caseId}`, {
      method: "DELETE",
    });
  }

  // Specific method for updating case status (backward compatibility)
  async updateCaseStatus(caseId: string, status: string, analysisResult?: any) {
    const updateData: any = { status };
    if (analysisResult) {
      updateData.analysis_result = analysisResult;
      updateData.last_updated = new Date().toISOString();
    }
    return this.updateAssessmentCase(caseId, updateData);
  }

  // Specific method for updating case documents (backward compatibility)
  async updateCaseDocuments(caseId: string, documents: any[]) {
    const updateData = {
      documents,
      last_updated: new Date().toISOString(),
    };
    return this.updateAssessmentCase(caseId, updateData);
  }

  // Prompt sections
  async getPromptSections(moduleType: string) {
    return this.request(`/prompts/sections?moduleType=${moduleType}`);
  }
}

export const apiClient = new ApiClient();
