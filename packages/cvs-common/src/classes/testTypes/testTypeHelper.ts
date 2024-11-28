import { ITestTypeList } from './ITestTypeList';

/**
 * Class containing test type helper functions
 */
export class TestTypeHelper {
	/**
	 * Helper function to validate a test type id exists in a specific test type list
	 * @param testTypeList - list of test type ids
	 * @param testTypeId - test type id which is being tested
	 */
	static validateTestTypeIdInList(testTypeList: ITestTypeList, testTypeId: string): boolean {
		return testTypeList.IDS.includes(testTypeId);
	}

	/**
	 * Helper function to validate a test type id exists in one of many test type lists
	 * @param testTypeLists - array containing lists of test type ids
	 * @param testTypeId - test type id which is being tested
	 */
	static validateTestTypeIdInLists(testTypeLists: ITestTypeList[], testTypeId: string): boolean {
		return testTypeLists.some((testType: ITestTypeList) => testType.IDS.includes(testTypeId));
	}
}
