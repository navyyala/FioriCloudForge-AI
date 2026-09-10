# Phase 1 - Analysis & Discovery

Act as a Principal SAP Fiori/UI5 Migration Architect.

## Objective

Assess this SAP WebIDE application and create a complete migration strategy before any implementation activities.

---

## Collect Inputs

### Current Landscape

- Current UI5 Version
- Target UI5 Version
- Migration Target
  - BAS
  - VS Code
  - Both

### Application Type

- Freestyle UI5
- Fiori Elements
- Hybrid

### Technical Options

- Optimization Required
- Performance Improvements Required
- Accessibility Improvements Required

### Deployment Target

- ABAP Repository

---

## Discovery Activities

Analyze:

- manifest.json
- Component.js
- Controllers
- Views
- Fragments
- Formatters
- Models
- Services
- Utility Classes
- localService
- neo-app.json
- package.json (if available)
- ui5.yaml (if available)
- .project
- .classpath
- .settings

---

## Backend Analysis

Retrieve metadata using SAP Connection Manager.

Analyze:

- $metadata
- annotations
- entity sets
- navigation properties
- actions
- function imports

Validate:

- Metadata integrity
- Service availability
- Annotation completeness
- Unsupported entities

---

## Identify

Determine:

- Current UI5 Version
- OData Version
- OData Services
- Reusable Components
- Reusable Libraries
- Custom Controls
- Custom Libraries
- Third-Party Libraries

---

## Launchpad Analysis

Analyze:

- Semantic Objects
- Actions
- Cross-App Navigation
- Tile Configuration
- Target Mappings

---

## Compare Against Target Architecture

Compare current application against:

- BAS Structure
- VS Code Structure
- SAP Fiori Tools Structure
- UI5 Tooling Standards

Identify:

- Missing Files
- Required Files
- Deprecated Configurations
- Unsupported Configurations

---

## Technical Debt Assessment

Detect:

- Deprecated APIs
- jQuery.sap usage
- Legacy module loading
- Synchronous calls
- Duplicate logic
- Large Controllers
- Tight Coupling
- Dead Code

---

## Validation

Validate against:

### UI5 Demo Kit

- MVC Compliance
- Model Usage
- Binding Strategy
- Fragment Usage
- Reusability

### SAP Fiori Guidelines

- UI Consistency
- Navigation Standards
- Fiori UX

### Security

- XSS Risks
- Unsafe HTML Usage
- Local Storage Concerns

### Accessibility

- ARIA Labels
- Keyboard Navigation
- Semantic Controls

---

## Performance Assessment

Analyze:

- OData Calls
- Batch Requests
- Deep Expands
- Select Usage
- Table Performance
- Rendering Performance
- Routing Performance
- Fragment Loading
- Lazy Loading
- Busy Indicator Handling

---

## Test Assessment

Analyze availability of:

- Unit Tests
- QUnit Tests
- OPA Tests
- Mock Server
- Integration Tests

Identify gaps.

---

## Application Complexity Assessment

Determine application complexity using measurable application characteristics.

### Complexity Factors

#### Views

- Less than 5 = Simple
- 5 to 20 = Medium
- More than 50 = Complex
- More than 50 = Very Complex

#### Controllers

- Less than 5 = Simple
- 5 to 20 = Medium
- More than 20 = Complex
- More than 40 = Very Complex

#### Fragments

- Less than 10 = Simple
- 10 to 30 = Medium
- More than 30 = Complex

#### OData Services

- 1 = Simple
- 2 to 5 = Medium
- More than 5 = Complex

### Additional Complexity Indicators

Increase complexity when the application contains:

- Custom Controls
- Reuse Libraries
- Extension Projects
- Cross-App Navigation
- Workflow Integration
- Dynamic Routing
- Multiple Components
- Third-Party Libraries
- Custom Authentication Logic

---

### Complexity Classification

Classify the application as:

#### Simple

Characteristics:

- Small application
- Limited features
- Single OData service
- Minimal customization

Typical Manual Effort:

40 to 100 Hours

---

#### Medium

Characteristics:

- Multiple business processes
- Multiple controllers/views
- Moderate customization

Typical Manual Effort:

100 to 160 Hours

---

#### Complex

Characteristics:

- Enterprise application
- Multiple services
- Custom controls
- Extensive enhancements

Typical Manual Effort:

160 to 400 Hours

---

#### Very Complex

Characteristics:

- Large enterprise application suite
- Heavy customizations
- Multiple integrations
- Extensive dependencies

Typical Manual Effort:

400+ Hours

---

### Agent Assisted Effort

Estimate effort based on actual findings.

Typical ranges:

Analysis:
1 to 4 Hours

Migration:
2 to 12 Hours

Testing & Documentation:
1 to 8 Hours

---

### Effort Estimation Output

Generate:

- Application Complexity Classification
- Complexity Justification
- Estimated Manual Effort
- Estimated Agent Assisted Effort
- Estimated Hours Saved
- Estimated Percentage Reduction

Example:

Application Complexity: Complex

Justification:

- 62 Views
- 29 Controllers
- 36 Fragments
- 4 OData Services
- 3 Custom Controls

Estimated Manual Effort:
220 Hours

Estimated Agent Assisted Effort:
28 Hours

Estimated Time Saved:
192 Hours

Estimated Effort Reduction:
87%

Provide all assumptions used for the calculation.

---

## Assessment Findings
Present the following assessment findings:

1. Migration Assessment Report

2. Migration Impact Analysis

3. Technical Debt Report

4. Modernization Opportunities

5. Performance Improvement Report

6. Security Assessment

7. Accessibility Assessment

8. Migration Risks

9. Application Complexity Assessment

10. Manual vs Agent Effort Estimation

11. Migration Readiness Score

12. Recommended Migration Approach

Do not create formal documentation.
Do not modify any files
---

## Approval Gate

Display:

- Proposed Changes
- Risks
- Impact Analysis
- Modernization Opportunities
- Complexity Assessment
- Estimated Effort Savings
- Recommended Migration Strategy

Wait for approval before modifying any files.