# Deployment Guide

This guide covers deploying the DotNet Calendar application.

## Frontend Deployment (Vercel)

### Prerequisites

1. A Vercel account (https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`

### Manual Deployment

1. Navigate to the frontend directory:
   ```bash
   cd frontend/dotnet-calendar
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy using Vercel CLI:
   ```bash
   vercel --prod
   ```

   Or deploy via Vercel dashboard by importing the GitHub repository.

### Automatic Deployment (GitHub Actions)

The project includes a GitHub Actions workflow that automatically deploys to Vercel on push to main branch.

#### Setup Steps:

1. **Create a Vercel project**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Set the root directory to `frontend/dotnet-calendar`
   - Framework preset: Create React App
   - Build command: `npm run build`
   - Output directory: `build`

2. **Get Vercel credentials**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel login`
   - Run `vercel link` in the `frontend/dotnet-calendar` directory
   - Get your token: `vercel tokens create`
   - Get org ID: Check `.vercel/project.json` for `orgId`
   - Get project ID: Check `.vercel/project.json` for `projectId`

3. **Add GitHub secrets**:
   Go to your GitHub repository settings > Secrets and add:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

4. **Configure environment variables in Vercel**:
   In your Vercel project settings, add:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://your-api.com/api`)

### Environment Variables

The frontend uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5191/api` |

## Backend Deployment Options

### Option 1: Azure App Service

1. Create an Azure App Service:
   ```bash
   az webapp create --name dotnet-calendar-api --resource-group myResourceGroup --plan myAppServicePlan --runtime "DOTNET|9.0"
   ```

2. Deploy using GitHub Actions or Azure DevOps

### Option 2: Docker Container

1. Create a Dockerfile in `backend/DotNetCalendarAPI`:
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
   WORKDIR /app
   EXPOSE 80

   FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
   WORKDIR /src
   COPY ["DotNetCalendarAPI.csproj", "."]
   RUN dotnet restore
   COPY . .
   RUN dotnet build -c Release -o /app/build

   FROM build AS publish
   RUN dotnet publish -c Release -o /app/publish

   FROM base AS final
   WORKDIR /app
   COPY --from=publish /app/publish .
   ENTRYPOINT ["dotnet", "DotNetCalendarAPI.dll"]
   ```

2. Build and push to container registry
3. Deploy to Azure Container Instances, AWS ECS, or Kubernetes

### Option 3: IIS Deployment

1. Publish the application:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. Configure IIS with .NET Core Hosting Bundle
3. Create application pool with "No Managed Code"
4. Point to the publish folder

## CORS Configuration

Remember to update CORS settings in `Program.cs` to include your frontend domain:

```csharp
app.UseCors(builder => builder
    .WithOrigins("https://your-frontend-domain.vercel.app")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API deployed and accessible
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Custom domain configured (optional)
- [ ] Monitoring and logging set up