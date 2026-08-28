import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import studentFeedbackService from '../../services/studentFeedbackService';
import { PageSpinner, ErrorAlert } from '../../components/ui';


function GiveFeedback() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Core Data
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wizard States
  const [step, setStep] = useState(1); // 1: Questions, 2: Comments, 3: Review, 4: Success
  const [ratings, setRatings] = useState({}); // { [questionId]: rating }
  const [comment, setComment] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        // 1. Fetch check status
        const statusRes = await studentFeedbackService.getFeedbackStatus(courseId);
        if (statusRes.data?.data?.submitted) {
          navigate('/student/dashboard');
          return;
        }

        // 2. Fetch course details (find from course listing)
        const coursesRes = await studentFeedbackService.getCourses();
        const coursesList = coursesRes.data?.data?.courses || [];
        const targetCourse = coursesList.find((c) => c.courseId === courseId);
        if (!targetCourse) {
          setError('Course not found in enrollment records.');
          setLoading(false);
          return;
        }
        setCourse(targetCourse);

        // 3. Fetch active questions
        const questionsRes = await studentFeedbackService.getQuestions();
        if (questionsRes.data?.success) {
          setQuestions(questionsRes.data.data);
          // Initialize ratings mapping
          const initialRatings = {};
          questionsRes.data.data.forEach((q) => {
            initialRatings[q._id] = 0; // 0 indicates unselected
          });
          setRatings(initialRatings);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to initialize survey.');
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [courseId, navigate]);

  const handleSelectRating = (qid, val) => {
    setValidationError(null);
    setRatings((prev) => ({
      ...prev,
      [qid]: val
    }));
  };

  const handleNextToComments = () => {
    // Validate that every question has a selected rating
    const unrated = questions.some((q) => !ratings[q._id] || ratings[q._id] === 0);
    if (unrated) {
      setValidationError('Please rate all evaluation questions before continuing.');
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const handleSubmitFeedback = async () => {
    if (!isConfirmed) {
      setValidationError('You must check the confirmation box to submit.');
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    try {
      const formattedRatings = Object.entries(ratings).map(([qid, val]) => ({
        questionId: qid,
        rating: val
      }));

      const response = await studentFeedbackService.submitFeedback({
        courseId,
        ratings: formattedRatings,
        comment
      });

      if (response.data && response.data.success) {
        setStep(4);
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingSummaryLabel = (val) => {
    const labels = {
      1: 'Unsatisfactory',
      2: 'Needs Improvement',
      3: 'Satisfactory',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[val] || 'Not Rated';
  };

  if (loading) {
    return (
      <StudentLayout>
        <PageSpinner label="Loading survey questionnaire..." />
      </StudentLayout>
    );
  }


  if (error) {
    return (
      <StudentLayout>
        <div className="space-y-4">
          <ErrorAlert message={error} />
          <Link to="/student/dashboard" className="inline-block text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Wizard Progress Indicator Header */}
        {step < 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                  Course Feedback Appraisal
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {course?.courseCode} - {course?.courseName}
                </h3>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Instructor: <span className="font-bold text-slate-700">{course?.faculty?.name}</span>
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-800">Step {step} of 3</span>
            </div>

            {/* Visual Step Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 1: RATING QUESTIONS */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="border-b pb-2 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Evaluation Questions</h4>
              <span className="text-[10px] text-slate-400">All questions are required</span>
            </div>

            {validationError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                {validationError}
              </p>
            )}

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q._id} className="space-y-3">
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = ratings[q._id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectRating(q._id, val)}
                          className={`w-10 h-10 rounded-full border text-xs font-extrabold transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200'
                          }`}
                          aria-label={`Rate ${val} stars out of 5 for question ${idx + 1}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleNextToComments}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OPTIONAL COMMENTS */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
              Qualitative Comments (Optional)
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-semibold text-slate-500">
                  Provide additional text comments regarding the instructor&apos;s performance:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {comment.length} / 1000 characters
                </span>
              </div>
              <textarea
                rows="5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write constructive criticism, appreciate instructional methods, or describe suggestions (max 1000 characters)..."
                className="w-full text-xs border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 resize-none leading-relaxed"
                maxLength="1000"
              />
            </div>

            <div className="flex justify-between pt-4 border-t text-xs font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Review Feedback →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b pb-2">
              Appraisal Summary Review
            </h4>

            {validationError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded p-2.5">
                {validationError}
              </p>
            )}

            {/* Ratings Summary */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Ratings Selected</span>
              <div className="divide-y text-xs text-slate-700 space-y-2">
                {questions.map((q, idx) => (
                  <div key={q._id} className="pt-2 flex justify-between items-start gap-4">
                    <p className="font-semibold text-slate-800 leading-relaxed max-w-lg">
                      {idx + 1}. {q.text}
                    </p>
                    <span className="font-bold text-indigo-650 text-right whitespace-nowrap">
                      {ratings[q._id]} - {getRatingSummaryLabel(ratings[q._id])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Summary */}
            <div className="space-y-2 pt-4 border-t">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Qualitative Comments</span>
              <p className="text-xs text-slate-700 bg-slate-50 border rounded-lg p-3 leading-relaxed italic">
                {comment.trim() ? comment : 'No qualitative comments provided.'}
              </p>
            </div>

            {/* Immutability Confirmation Checkbox */}
            <div className="pt-4 border-t space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start space-x-3 text-xs text-indigo-950">
                <input
                  type="checkbox"
                  id="confirm-chk"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-350 focus:ring-indigo-600 text-indigo-600"
                />
                <label htmlFor="confirm-chk" className="font-medium cursor-pointer leading-relaxed select-none">
                  I confirm that these ratings and comments are my final appraisal. I understand that evaluations are completely **anonymized** and once submitted, they become **immutable** (cannot be edited or deleted).
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t text-xs font-bold">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="border px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
              >
                ← Edit Comments
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={submitting || !isConfirmed}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Feedback</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center space-y-6">
            <span className="text-5xl block animate-bounce">🎉</span>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900">Appraisal Registered Successfully!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Thank you for completing this course evaluation. Your response has been anonymized and registered in the immutable database block.
              </p>
            </div>
            <div className="pt-4 border-t text-xs">
              <Link
                to="/student/dashboard"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Return to My Courses
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default GiveFeedback;
