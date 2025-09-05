import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Send, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppleHealthService } from '@/services/appleHealthService';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export function AppleHealthTest() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [sampleData, setSampleData] = useState(`[
  {
    "type": "DietaryWater",
    "date": "${new Date().toISOString().split('T')[0]}",
    "value": 2.5,
    "unit": "L"
  },
  {
    "type": "BodyMass",
    "date": "${new Date().toISOString().split('T')[0]}",
    "value": 75.5,
    "unit": "kg"
  }
]`);

  const sendTestData = async () => {
    if (!user) {
      setTestResult({ success: false, message: 'No user logged in' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Parse the sample data
      const healthData = JSON.parse(sampleData);
      
      // Send to the Cloud Function
      const response = await fetch(
        'https://us-central1-healthhub-d43d3.cloudfunctions.net/ingestAppleHealth',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            data: healthData
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResult({
          success: true,
          message: `Successfully sent ${healthData.length} health records`,
          data: result
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Failed to send data',
          data: result
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFirestoreRead = async () => {
    if (!user) {
      setTestResult({ success: false, message: 'No user logged in' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Test reading data from Firestore
      const today = new Date().toISOString().split('T')[0];
      
      // Test multiple data types
      const [hydrationData, availableTypes, rawHydration] = await Promise.all([
        AppleHealthService.getHydrationData(1, user.id),
        AppleHealthService.getAvailableDataTypes(user.id, today),
        AppleHealthService.getRawHealthData(user.id, today, 'DietaryWater')
      ]);

      setTestResult({
        success: true,
        message: 'Successfully read data from Firestore',
        data: {
          hydrationData,
          availableTypes,
          rawHydration,
          today
        }
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error reading from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleDataType = (type: string) => {
    try {
      const data = JSON.parse(sampleData);
      const today = new Date().toISOString().split('T')[0];
      
      const newRecord = {
        type,
        date: today,
        value: type === 'DietaryWater' ? 2.5 : 
               type === 'BodyMass' ? 75.5 :
               type === 'HeartRateVariabilitySDNN' ? 45 :
               type === 'AppleExerciseTime' ? 30 :
               type === 'ActiveEnergyBurned' ? 300 : 100,
        unit: type === 'DietaryWater' ? 'L' : 
              type === 'BodyMass' ? 'kg' :
              type === 'HeartRateVariabilitySDNN' ? 'ms' :
              type === 'AppleExerciseTime' ? 'min' :
              type === 'ActiveEnergyBurned' ? 'kcal' : ''
      };

      data.push(newRecord);
      setSampleData(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error adding sample data:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" />
            Apple Health Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Admin access required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" />
            Apple Health Data Testing
          </CardTitle>
          <CardDescription>
            Test the Apple Health data flow from iOS Shortcut to HealthHub dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cloud Function Endpoint Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Cloud Function Endpoint</h4>
            <code className="text-sm break-all">
              https://us-central1-healthhub-d43d3.cloudfunctions.net/ingestAppleHealth
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Your Firebase User ID: <code>{user?.id}</code>
            </p>
          </div>

          {/* Quick Add Sample Data Types */}
          <div>
            <Label className="text-sm font-medium">Quick Add Sample Data</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                'DietaryWater',
                'BodyMass', 
                'HeartRateVariabilitySDNN',
                'AppleExerciseTime',
                'ActiveEnergyBurned'
              ].map(type => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addSampleDataType(type)}
                  className="text-xs"
                >
                  + {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Sample Data Editor */}
          <div className="space-y-2">
            <Label htmlFor="sample-data">Sample Health Data (JSON)</Label>
            <Textarea
              id="sample-data"
              value={sampleData}
              onChange={(e) => setSampleData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter JSON health data..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={sendTestData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Test Data'}
            </Button>
            
            <Button
              variant="outline"
              onClick={testFirestoreRead}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {isLoading ? 'Reading...' : 'Test Firestore Read'}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <div className="flex-1">
                  <AlertDescription className="font-medium">
                    {testResult.message}
                  </AlertDescription>
                  {testResult.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Show Details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Badge variant="outline">1</Badge>
            <p className="text-sm ml-6">
              Test the data flow above by clicking "Send Test Data"
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">2</Badge>
            <p className="text-sm ml-6">
              Check the Hydration and Training panels to see if sample data appears
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">3</Badge>
            <p className="text-sm ml-6">
              Set up the iOS Shortcut using the guide in <code>/docs/iOS Shortcut Setup Guide.md</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">4</Badge>
            <p className="text-sm ml-6">
              Test real data export from your iPhone using the shortcut
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
