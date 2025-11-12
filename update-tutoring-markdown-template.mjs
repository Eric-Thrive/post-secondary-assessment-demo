import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

const updatedTemplate = `You are converting a tutoring JSON report into markdown format for the unified viewer.

CRITICAL: Use these EXACT section headers (case-sensitive):
- ## Case Information
- ## Documents Reviewed  
- ## Student Overview
- ## Key Support Strategies
- ## Student's Strengths
- ## Student's Challenges

The JSON data will be provided. Generate clean, well-formatted markdown following this structure:

# Student Support Report — Tutor Orientation

## Case Information

**Student:** {student_name}  
**Grade:** {grade}  
**School Year:** {school_year}  
**Date Created:** {generated_at}

---

## Documents Reviewed

{list each document with filename and type}

---

## Student Overview

{student_overview.paragraph.full}

---

## Key Support Strategies

{key_support_strategies.paragraph.full}

---

## Student's Strengths

{render each strength as a table with columns: Strength, What You See, What to Do}

---

## Student's Challenges

{render ea