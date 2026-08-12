export type JobsStackParamList = {
  JobsList: { status?: string } | undefined;
  JobDetail: { jobId: string };
  JobComments: { jobId: string };
  JobStatusUpdate: { jobId: string };
  JobCreate: undefined;
  JobEdit: { jobId: string };
  JobReassign: { jobId: string };
  EnquiriesList: undefined;
  EnquiryDetail: { enquiryId: string };
};
